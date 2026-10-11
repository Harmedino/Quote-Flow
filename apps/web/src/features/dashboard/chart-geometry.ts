export interface ChartPoint {
  x: number;
  y: number;
}

export interface StepDay {
  date: string;
  /** What came in on the day. */
  amount: number;
  /** The running total at the end of the day. */
  total: number;
  /** Who it came from, one name per payment or quote. */
  names: string[];
}

/** Each day's amount with the total so far, and the names behind it. */
export function runningTotals(
  days: readonly { date: string; value: number }[],
  entries: readonly { date: string; customerName: string }[],
): StepDay[] {
  const names = new Map<string, string[]>();
  for (const entry of entries) {
    names.set(entry.date, [...(names.get(entry.date) ?? []), entry.customerName]);
  }
  let total = 0;
  return days.map((day) => {
    total += day.value;
    return { date: day.date, amount: day.value, total, names: names.get(day.date) ?? [] };
  });
}

/**
 * A round top for the value axis, at or above `value`, and the step between its gridlines: the
 * smallest of 1, 2, 2.5 or 5 times a power of ten that covers the value in two steps.
 */
export function niceScale(value: number): { max: number; step: number } {
  if (value <= 0) return { max: 1, step: 1 };
  const half = value / 2;
  const power = 10 ** Math.floor(Math.log10(half));
  const step = [1, 2, 2.5, 5, 10].map((factor) => factor * power).find((s) => s >= half) ?? half;
  return { max: Math.ceil(value / step) * step, step };
}

/** The plot area inside the SVG: values run from `base` (zero) up to `top`. */
export interface ChartFrame {
  width: number;
  height: number;
  left: number;
  right: number;
  top: number;
  base: number;
}

export interface RunningTotalGeometry {
  /** The centre of each day's slot on the ruler. */
  xs: number[];
  /** The running total at the end of each day. */
  points: ChartPoint[];
  /** One ruler tick per day boundary; every seventh is a major tick. */
  ticks: { x: number; major: boolean }[];
  /** The step line, from zero on the left to today's total on the right. */
  line: string;
  /** The step line closed down to zero, for the fill. */
  area: string;
  /** Every horizontal and vertical run of the line, for keeping labels off it. */
  segments: [ChartPoint, ChartPoint][];
  y: (value: number) => number;
}

const round = (value: number) => Math.round(value * 10) / 10;

/** The running-total step chart over `days`, scaled so `max` sits at the top of the frame. */
export function runningTotalGeometry(
  days: readonly StepDay[],
  max: number,
  frame: ChartFrame,
): RunningTotalGeometry {
  const { left, right, top, base, width } = frame;
  const slot = (width - left - right) / Math.max(1, days.length);
  const y = (value: number) => round(base - (value / max) * (base - top));
  const xs = days.map((_, index) => round(left + slot * index + slot / 2));
  const points = days.map((day, index) => ({ x: xs[index] ?? 0, y: y(day.total) }));
  const ticks = Array.from({ length: days.length + 1 }, (_, index) => ({
    x: round(left + slot * index),
    major: index % 7 === 0,
  }));

  const corners: ChartPoint[] = [{ x: left, y: base }];
  let level = base;
  points.forEach((point, index) => {
    if ((days[index]?.amount ?? 0) <= 0) return;
    corners.push({ x: point.x, y: level }, point);
    level = point.y;
  });
  corners.push({ x: width - right, y: level });

  const line = corners.map((point, index) => `${index ? 'L' : 'M'}${point.x} ${point.y}`).join(' ');
  const segments = corners
    .slice(1)
    .map((point, index): [ChartPoint, ChartPoint] => [corners[index] ?? point, point]);
  return {
    xs,
    points,
    ticks,
    line,
    area: `${line} L${width - right} ${base} L${left} ${base} Z`,
    segments,
    y,
  };
}

export interface LabelCandidate {
  /** The day's index; labels are tried in the order given. */
  index: number;
  point: ChartPoint;
  width: number;
}

export interface PlacedLabel {
  index: number;
  /** The anchor point of the first line's baseline. */
  x: number;
  y: number;
  anchor: 'start' | 'end';
}

interface Box {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

/** A two-line label: the amount, then the date and name 15px below it. */
const LABEL_ASCENT = 11;
const LABEL_HEIGHT = LABEL_ASCENT + 15 + 3;
const LABEL_GAP = 12;
const LABEL_RISE = 22;
const DOT_RADIUS = 6;

/** Where a label may go around its point, best first. */
const PLACEMENTS = [
  { side: 1, rise: -1 },
  { side: 1, rise: 1 },
  { side: -1, rise: 1 },
  { side: -1, rise: -1 },
] as const;

function overlaps(a: Box, b: Box): boolean {
  return a.x1 < b.x2 && b.x1 < a.x2 && a.y1 < b.y2 && b.y1 < a.y2;
}

function segmentBox([from, to]: [ChartPoint, ChartPoint]): Box {
  return {
    x1: Math.min(from.x, to.x),
    y1: Math.min(from.y, to.y),
    x2: Math.max(from.x, to.x),
    y2: Math.max(from.y, to.y),
  };
}

/**
 * Puts each label beside its point (right and above first, then right below, left below, left
 * above), where it stays inside the frame and clear of the line, the drop lines, the points and
 * the labels already placed. A label that fits nowhere is left out.
 */
export function placeLabels(
  candidates: readonly LabelCandidate[],
  geometry: Pick<RunningTotalGeometry, 'segments'>,
  frame: ChartFrame,
  /** Every marked point, labelled or not. */
  points: readonly ChartPoint[],
): PlacedLabel[] {
  const obstacles: Box[] = [
    ...geometry.segments.map(segmentBox),
    ...points.flatMap((point) => [
      { x1: point.x, y1: point.y, x2: point.x, y2: frame.base },
      {
        x1: point.x - DOT_RADIUS,
        y1: point.y - DOT_RADIUS,
        x2: point.x + DOT_RADIUS,
        y2: point.y + DOT_RADIUS,
      },
    ]),
  ];
  const placed: PlacedLabel[] = [];
  for (const { index, point, width } of candidates) {
    for (const { side, rise } of PLACEMENTS) {
      const x = round(point.x + side * LABEL_GAP);
      const y = round(point.y + rise * LABEL_RISE);
      const box = {
        x1: side > 0 ? x : x - width,
        x2: side > 0 ? x + width : x,
        y1: y - LABEL_ASCENT,
        y2: y - LABEL_ASCENT + LABEL_HEIGHT,
      };
      const inside =
        box.x1 >= frame.left &&
        box.x2 <= frame.width - frame.right &&
        box.y1 >= 0 &&
        box.y2 < frame.base;
      if (inside && !obstacles.some((obstacle) => overlaps(box, obstacle))) {
        placed.push({ index, x, y, anchor: side > 0 ? 'start' : 'end' });
        obstacles.push(box);
        break;
      }
    }
  }
  return placed;
}

/** Roughly how wide a line of text is: Plex Mono and Archivo's figures run about 0.6em. */
export function textWidth(text: string, fontSize: number): number {
  return Math.ceil(text.length * fontSize * 0.6);
}

/** Which of `count` equal slots `fraction` falls in (0 = left edge, 1 = right edge). */
export function slotIndex(fraction: number, count: number): number {
  if (count <= 1) return 0;
  return Math.min(count - 1, Math.max(0, Math.floor(fraction * count)));
}

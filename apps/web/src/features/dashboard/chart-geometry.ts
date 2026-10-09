export interface ChartPoint {
  x: number;
  y: number;
}

export interface AreaChartGeometry {
  points: ChartPoint[];
  /** The smoothed line through every point. */
  line: string;
  /** The line closed down to the baseline, for the gradient fill. */
  area: string;
}

/** Room kept above the highest value and below zero, so the stroke is never clipped. */
const TOP_PADDING = 24;
const BOTTOM_PADDING = 12;

/**
 * SVG paths for an area chart of `values` spread evenly across `width`. Each segment is a cubic
 * curve with flat handles at both points, so the line is smooth but never overshoots: it never
 * dips below zero between two empty days or rises above the best day.
 */
export function areaChartGeometry(
  values: readonly number[],
  width: number,
  height: number,
): AreaChartGeometry {
  const max = Math.max(1, ...values);
  const step = values.length > 1 ? width / (values.length - 1) : 0;
  const plotHeight = height - TOP_PADDING - BOTTOM_PADDING;
  const points = values.map((value, index) => ({
    x: index * step,
    y: height - BOTTOM_PADDING - (Math.max(0, value) / max) * plotHeight,
  }));

  const line = points
    .map((point, index) => {
      if (index === 0) return `M ${point.x} ${point.y}`;
      const previous = points[index - 1] ?? point;
      const midX = (previous.x + point.x) / 2;
      return `C ${midX} ${previous.y}, ${midX} ${point.y}, ${point.x} ${point.y}`;
    })
    .join(' ');
  const last = points.at(-1);
  const area = last ? `${line} L ${last.x} ${height} L 0 ${height} Z` : '';
  return { points, line, area };
}

/** The index of the point nearest to `fraction` (0 = left edge, 1 = right edge). */
export function nearestIndex(fraction: number, count: number): number {
  if (count <= 1) return 0;
  const index = Math.round(fraction * (count - 1));
  return Math.min(count - 1, Math.max(0, index));
}

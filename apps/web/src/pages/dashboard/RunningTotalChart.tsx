import type { CurrencyCode } from '@quoteflow/shared';
import { type KeyboardEvent, type PointerEvent, useId, useState } from 'react';
import {
  type ChartFrame,
  type StepDay,
  niceScale,
  placeLabels,
  runningTotalGeometry,
  slotIndex,
  textWidth,
} from '@/features/dashboard/chart-geometry';
import { formatMoneyAxis, formatShortDate } from '@/features/dashboard/dashboard-format';
import { useElementWidth } from '@/features/dashboard/use-element-width';
import { cn } from '@/lib/cn';
import { formatMoney } from '@/lib/format';

/** The concept's two sizes: a value axis and labelled steps, or just the ruler on a phone. */
const FULL = { height: 162, top: 22, bottom: 38, right: 8 };
const COMPACT = { height: 118, top: 16, bottom: 30, right: 6 };
const AXIS_FONT = 11;
const VALUE_FONT = 13.5;
const MAX_LABELS = 4;
const MAX_NAME = 18;

export interface ChartNoun {
  one: string;
  other: string;
}

export interface RunningTotalChartProps {
  days: readonly StepDay[];
  currency: CurrencyCode;
  /** What each step is, e.g. payment / payments. */
  noun: ChartNoun;
  /** Names the day picker for assistive technology, e.g. "Payments received by day". */
  label: string;
  compact: boolean;
  /** Set when nothing came in: shown over a flat line instead of a day picker. */
  emptyMessage?: { title: string; hint: string };
}

const KEY_STEPS: Record<string, (index: number, last: number) => number> = {
  ArrowLeft: (index) => index - 1,
  ArrowDown: (index) => index - 1,
  ArrowRight: (index) => index + 1,
  ArrowUp: (index) => index + 1,
  Home: () => 0,
  End: (_, last) => last,
};

function shorten(name: string): string {
  return name.length > MAX_NAME ? `${name.slice(0, MAX_NAME - 1).trimEnd()}…` : name;
}

/** "Amaka Nwankwo", or "2 payments" when several came in on the day. */
function whoFrom(day: StepDay, noun: ChartNoun): string {
  if (day.names.length === 1) return day.names[0] ?? '';
  return `${day.names.length} ${noun.other}`;
}

/** Everything the SVG draws, at the chart's real width so text stays at its real size. */
function layoutChart({
  days,
  currency,
  noun,
  compact,
  width,
}: Pick<RunningTotalChartProps, 'days' | 'currency' | 'noun' | 'compact'> & { width: number }) {
  const size = compact ? COMPACT : FULL;
  const scale = niceScale(days.at(-1)?.total ?? 0);
  const axis = [0, scale.step, scale.max].map((value) => ({
    value,
    text: formatMoneyAxis(value, currency),
  }));
  const frame: ChartFrame = {
    width,
    height: size.height,
    left: compact ? 0 : Math.max(...axis.map((tick) => textWidth(tick.text, AXIS_FONT))) + 12,
    right: size.right,
    top: size.top,
    base: size.height - size.bottom,
  };
  const geometry = runningTotalGeometry(days, scale.max, frame);
  const steps = days.flatMap((day, index) => (day.amount > 0 ? [index] : []));
  const pins = steps.map((index) => geometry.points[index] ?? { x: 0, y: 0 });
  const texts = new Map(
    steps.map((index) => {
      const day = days[index];
      return [
        index,
        {
          value: `+${formatMoney(day?.amount ?? 0, currency)}`,
          sub: day ? `${formatShortDate(day.date)} · ${shorten(whoFrom(day, noun))}` : '',
        },
      ];
    }),
  );
  const biggest = [...steps]
    .sort((a, b) => (days[b]?.amount ?? 0) - (days[a]?.amount ?? 0))
    .slice(0, MAX_LABELS);
  const labels = compact
    ? []
    : placeLabels(
        biggest.map((index) => ({
          index,
          point: geometry.points[index] ?? { x: 0, y: 0 },
          width: Math.max(
            textWidth(texts.get(index)?.value ?? '', VALUE_FONT),
            textWidth(texts.get(index)?.sub ?? '', AXIS_FONT),
          ),
        })),
        geometry,
        frame,
        pins,
      );

  // Dates under the major ticks and "Today" at the right end; a date that would run into
  // "Today" is left out.
  const todayStart = width - size.right - textWidth('Today', AXIS_FONT) - 8;
  const dates = (compact ? [0, 14] : [0, 7, 14, 21]).flatMap((index) => {
    const day = days[index];
    const tick = geometry.ticks[index];
    if (!day || !tick) return [];
    const text = formatShortDate(day.date);
    return tick.x + 3 + textWidth(text, AXIS_FONT) < todayStart ? [{ x: tick.x + 3, text }] : [];
  });
  return { axis, frame, geometry, pins, texts, labels, dates };
}

/**
 * The running total as a step chart over a tape-measure ruler: each day something came in, the
 * line steps up and a pin drops on the ruler; the biggest steps are labelled with the amount,
 * date and customer. Pointing at it (or dragging a finger across it) shows any day; from the
 * keyboard it is a slider over the days.
 */
export function RunningTotalChart({
  days,
  currency,
  noun,
  label,
  compact,
  emptyMessage,
}: RunningTotalChartProps) {
  const [ref, width] = useElementWidth<HTMLDivElement>();
  const [active, setActive] = useState<number | null>(null);
  const clipId = `${useId().replace(/[^\w-]/g, '')}-reveal`;
  const size = compact ? COMPACT : FULL;
  const total = days.at(-1)?.total ?? 0;
  const money = (minor: number) => formatMoney(minor, currency);

  const chart = width > 0 ? layoutChart({ days, currency, noun, compact, width }) : null;

  const last = days.length - 1;
  const interactive = !emptyMessage && days.length > 0;
  const announced = days[active ?? last];
  const describe = (day: StepDay) =>
    `${formatShortDate(day.date)}: ${
      day.amount > 0 ? `+${money(day.amount)} from ${whoFrom(day, noun)}` : `no ${noun.other}`
    }, ${money(day.total)} so far`;

  function showDayAt(event: PointerEvent<HTMLDivElement>) {
    if (!chart) return;
    const { left, right } = chart.frame;
    const rect = event.currentTarget.getBoundingClientRect();
    const fraction = (event.clientX - rect.left - left) / (rect.width - left - right);
    setActive(slotIndex(fraction, days.length));
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const step = KEY_STEPS[event.key];
    if (!step) return;
    event.preventDefault();
    setActive(Math.min(last, Math.max(0, step(active ?? last, last))));
  }

  const sliderProps = interactive
    ? {
        role: 'slider',
        tabIndex: 0,
        'aria-label': label,
        'aria-valuemin': 1,
        'aria-valuemax': days.length,
        'aria-valuenow': (active ?? last) + 1,
        'aria-valuetext': announced && describe(announced),
        onKeyDown,
        onFocus: () => setActive((current) => current ?? last),
        onBlur: () => setActive(null),
        onPointerMove: showDayAt,
        onPointerDown: showDayAt,
        onPointerLeave: (event: PointerEvent<HTMLDivElement>) => {
          if (document.activeElement !== event.currentTarget) setActive(null);
        },
      }
    : {};

  const activeDay = active === null ? undefined : days[active];
  const activePoint = active === null ? undefined : chart?.geometry.points[active];

  return (
    <div
      ref={ref}
      style={{ height: size.height }}
      className="relative touch-pan-y rounded-lg select-none focus-visible:outline-offset-4"
      {...sliderProps}
    >
      {chart && (
        <svg
          width={chart.frame.width}
          height={chart.frame.height}
          viewBox={`0 0 ${chart.frame.width} ${chart.frame.height}`}
          aria-hidden="true"
          className="block overflow-visible"
        >
          <defs>
            <clipPath id={clipId}>
              {/* Grows from the left, so the line draws itself in (skipped with reduced motion). */}
              <rect
                className="animate-grow-width"
                x="0"
                y="-40"
                width={chart.frame.width}
                height={chart.frame.height + 40}
              />
            </clipPath>
          </defs>

          {!compact &&
            chart.axis.map((tick) => {
              const y = chart.geometry.y(tick.value);
              return (
                <g key={tick.value}>
                  {tick.value > 0 && (
                    <line
                      x1={chart.frame.left}
                      x2={chart.frame.width - chart.frame.right}
                      y1={y}
                      y2={y}
                      strokeDasharray="2 4"
                      className="stroke-line"
                    />
                  )}
                  <text
                    x={chart.frame.left - 10}
                    y={y + 4}
                    textAnchor="end"
                    className="fill-muted font-mono text-[11px]"
                  >
                    {tick.text}
                  </text>
                </g>
              );
            })}

          {/* The ruler: a baseline with a tick per day boundary, a long one every week. */}
          <line
            x1={chart.frame.left}
            x2={chart.frame.width - chart.frame.right}
            y1={chart.frame.base}
            y2={chart.frame.base}
            strokeWidth={1.5}
            className="stroke-line-strong"
          />
          {chart.geometry.ticks.map((tick) => (
            <line
              key={tick.x}
              x1={tick.x}
              x2={tick.x}
              y1={chart.frame.base}
              y2={chart.frame.base + (tick.major ? 9 : 4.5)}
              strokeWidth={tick.major ? 1.5 : 1}
              className={tick.major ? 'stroke-muted' : 'stroke-line-strong'}
            />
          ))}
          {chart.dates.map((date) => (
            <text
              key={date.text}
              x={date.x}
              y={chart.frame.base + 24}
              className="fill-muted font-mono text-[11px]"
            >
              {date.text}
            </text>
          ))}
          <text
            x={chart.frame.width - chart.frame.right}
            y={chart.frame.base + 24}
            textAnchor="end"
            className="fill-muted font-mono text-[11px]"
          >
            Today
          </text>

          <g clipPath={`url(#${clipId})`}>
            <path d={chart.geometry.area} className="fill-primary opacity-12" />
            {chart.pins.map((pin) => (
              <g key={pin.x}>
                <line
                  x1={pin.x}
                  x2={pin.x}
                  y1={pin.y}
                  y2={chart.frame.base}
                  strokeDasharray="2 3"
                  className="stroke-ink opacity-35"
                />
                <path
                  d={`M${pin.x - 4.5} ${chart.frame.base + 1} L${pin.x + 4.5} ${chart.frame.base + 1} L${pin.x} ${chart.frame.base + 8}Z`}
                  className="fill-ink"
                />
              </g>
            ))}
            <path
              d={chart.geometry.line}
              fill="none"
              strokeWidth={compact ? 2.25 : 2.5}
              strokeLinejoin="round"
              className={emptyMessage ? 'stroke-line-strong' : 'stroke-primary-ink'}
            />
            {chart.pins.map((pin) => (
              <circle
                key={pin.x}
                cx={pin.x}
                cy={pin.y}
                r={5}
                strokeWidth={compact ? 2.25 : 2.5}
                className="fill-surface stroke-ink"
              />
            ))}
            {!emptyMessage && (
              <circle
                cx={chart.frame.width - chart.frame.right}
                cy={chart.geometry.y(total)}
                r={4}
                className="fill-primary-ink"
              />
            )}
          </g>

          <g className={cn('transition-opacity', active !== null && 'opacity-20')}>
            {chart.labels.map((placed) => {
              const text = chart.texts.get(placed.index);
              return (
                <text key={placed.index} x={placed.x} y={placed.y} textAnchor={placed.anchor}>
                  <tspan className="fill-ink text-[13.5px] font-[750] tabular-nums">
                    {text?.value}
                  </tspan>
                  <tspan
                    x={placed.x}
                    dy={15}
                    className="fill-muted font-mono text-[11px] font-normal"
                  >
                    {text?.sub}
                  </tspan>
                </text>
              );
            })}
          </g>

          {activePoint && (
            <g>
              <line
                x1={activePoint.x}
                x2={activePoint.x}
                y1={chart.frame.top - 8}
                y2={chart.frame.base}
                className="stroke-muted"
              />
              <circle
                cx={activePoint.x}
                cy={activePoint.y}
                r={5.5}
                strokeWidth={2.5}
                className="fill-primary-ink stroke-surface"
              />
            </g>
          )}
        </svg>
      )}

      {activeDay && activePoint && chart && (
        // Beside the guide line, on whichever side has room, so it never hides the point.
        <div
          aria-hidden="true"
          className={cn(
            'pointer-events-none absolute top-0 z-10 rounded-[10px] bg-surface px-3 py-2 text-[12.5px] whitespace-nowrap shadow-(--shadow-elevated)',
            activePoint.x > width * 0.6 && '-translate-x-full',
          )}
          style={{ left: activePoint.x + (activePoint.x > width * 0.6 ? -12 : 12) }}
        >
          <p className="label-mono text-muted">{formatShortDate(activeDay.date)}</p>
          <p className="mt-1 font-semibold text-ink">
            {activeDay.amount > 0 ? (
              <>
                <span className="money">+{money(activeDay.amount)}</span> ·{' '}
                {whoFrom(activeDay, noun)}
              </>
            ) : (
              `No ${noun.other}`
            )}
          </p>
          <p className="text-muted">
            <span className="money">{money(activeDay.total)}</span> so far
          </p>
        </div>
      )}

      {emptyMessage && (
        <div className="absolute inset-x-0 top-0 bottom-10 flex flex-col items-center justify-center px-6 text-center">
          <p className="text-[14.5px] font-bold text-ink">{emptyMessage.title}</p>
          <p className="mt-1 max-w-xs text-[13px] text-pretty text-muted">{emptyMessage.hint}</p>
        </div>
      )}
    </div>
  );
}

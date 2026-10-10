import { type KeyboardEvent, type PointerEvent, useId, useMemo, useRef, useState } from 'react';
import { areaChartGeometry, nearestIndex } from '@/features/dashboard/chart-geometry';
import { cn } from '@/lib/cn';

const WIDTH = 720;
const HEIGHT = 200;
const GRIDLINES = [0.25, 0.5, 0.75];

export interface ChartDay {
  value: number;
  /** The figure for this day, e.g. "₦25,000". */
  valueLabel: string;
  /** What else to say about the day, e.g. "Oct 9 · ₦80,000 quoted". */
  detail: string;
}

export interface AreaChartProps {
  days: readonly ChartDay[];
  /** Names the day picker for assistive technology, e.g. "Payments received per day". */
  label: string;
  /** Set when every value is zero: shown over a flat line instead of a day picker. */
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

/**
 * A smoothed area chart drawn in SVG. Pointing at it (or dragging a finger across it) shows the
 * nearest day; from the keyboard it is a slider over the days, announcing each one.
 */
export function AreaChart({ days, label, emptyMessage }: AreaChartProps) {
  const [active, setActive] = useState<number | null>(null);
  const plotRef = useRef<HTMLDivElement>(null);
  const id = useId().replace(/[^\w-]/g, '');
  const geometry = useMemo(
    () =>
      areaChartGeometry(
        days.map((day) => day.value),
        WIDTH,
        HEIGHT,
      ),
    [days],
  );
  const last = days.length - 1;
  const point = active === null ? undefined : geometry.points[active];
  const day = active === null ? undefined : days[active];
  const interactive = !emptyMessage && days.length > 0;

  function showDayAt(event: PointerEvent<HTMLDivElement>) {
    const rect = plotRef.current?.getBoundingClientRect();
    if (!rect?.width) return;
    setActive(nearestIndex((event.clientX - rect.left) / rect.width, days.length));
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const step = KEY_STEPS[event.key];
    if (!step) return;
    event.preventDefault();
    setActive(Math.min(last, Math.max(0, step(active ?? last, last))));
  }

  const left = point ? (point.x / WIDTH) * 100 : 0;
  const announced = days[active ?? last];
  const sliderProps = interactive
    ? {
        role: 'slider',
        tabIndex: 0,
        'aria-label': label,
        'aria-valuemin': 1,
        'aria-valuemax': days.length,
        'aria-valuenow': (active ?? last) + 1,
        'aria-valuetext': announced && `${announced.valueLabel}, ${announced.detail}`,
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

  return (
    <div
      ref={plotRef}
      className="relative mt-4 touch-pan-y rounded-lg select-none focus-visible:outline-offset-4"
      {...sliderProps}
    >
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        preserveAspectRatio="none"
        aria-hidden="true"
        className="block h-44 w-full sm:h-52"
      >
        <defs>
          <clipPath id={`${id}-reveal`}>
            {/* Grows from the left, so the line draws itself in (skipped with reduced motion). */}
            <rect className="animate-grow-width" x="0" y="0" width={WIDTH} height={HEIGHT} />
          </clipPath>
          <linearGradient id={`${id}-fill`} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="var(--color-brand-500)" stopOpacity="0.3" />
            <stop offset="100%" stopColor="var(--color-brand-500)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {GRIDLINES.map((fraction) => (
          <line
            key={fraction}
            x1="0"
            x2={WIDTH}
            y1={HEIGHT * fraction}
            y2={HEIGHT * fraction}
            stroke="var(--color-stone-200)"
            strokeDasharray="4 6"
            vectorEffect="non-scaling-stroke"
          />
        ))}
        <g clipPath={`url(#${id}-reveal)`}>
          <path d={geometry.area} fill={`url(#${id}-fill)`} />
          <path
            d={geometry.line}
            fill="none"
            stroke={emptyMessage ? 'var(--color-stone-300)' : 'var(--color-brand-500)'}
            strokeWidth="2.5"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />
        </g>
        {point && (
          <line
            x1={point.x}
            x2={point.x}
            y1="0"
            y2={HEIGHT}
            stroke="var(--color-stone-400)"
            strokeOpacity="0.6"
            vectorEffect="non-scaling-stroke"
          />
        )}
      </svg>

      {point && day && (
        <div aria-hidden="true">
          <span
            className="pointer-events-none absolute size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-surface bg-brand-500"
            style={{ left: `${left}%`, top: `${(point.y / HEIGHT) * 100}%` }}
          />
          {/* Beside the crosshair, on whichever side has room, so it never hides the point. */}
          <div
            className={cn(
              'pointer-events-none absolute top-0 rounded-xl border border-stone-200 bg-surface px-3 py-2 text-xs whitespace-nowrap shadow-[var(--shadow-elevated)]',
              left > 60 && '-translate-x-full',
            )}
            style={{ left: `calc(${left}% ${left > 60 ? '-' : '+'} 12px)` }}
          >
            <p className="font-semibold text-stone-900 tabular-nums">{day.valueLabel}</p>
            <p className="text-stone-500">{day.detail}</p>
          </div>
        </div>
      )}

      {emptyMessage && (
        <div className="absolute inset-0 flex flex-col items-center justify-center px-6 pb-6 text-center">
          <p className="text-sm font-medium text-stone-900">{emptyMessage.title}</p>
          <p className="mt-1 max-w-xs text-sm text-pretty text-stone-500">{emptyMessage.hint}</p>
        </div>
      )}
    </div>
  );
}

import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

const COLUMNS = {
  2: '',
  3: 'sm:grid-cols-3',
  4: 'lg:grid-cols-4',
} as const;

export interface StatStripProps {
  /** Columns from `sm`/`lg` up; phones always show two. */
  columns?: keyof typeof COLUMNS;
  /** Names the group for assistive technology, e.g. "Quotes this month". */
  label?: string;
  className?: string;
  /** StatCard elements. */
  children: ReactNode;
}

/**
 * A row of figures joined into one bordered panel, divided by hairlines. On phones it wraps to
 * two columns; an odd last figure spans the full row so no empty cell shows.
 */
export function StatStrip({ columns = 4, label, className, children }: StatStripProps) {
  return (
    <dl
      aria-label={label}
      className={cn(
        'grid animate-fade-in-up grid-cols-2 gap-px overflow-hidden rounded-2xl border border-stone-200 bg-stone-200',
        '[&>*:last-child:nth-child(odd)]:col-span-2',
        columns === 3 && 'sm:[&>*:last-child:nth-child(odd)]:col-span-1',
        columns === 4 && 'lg:[&>*:last-child:nth-child(odd)]:col-span-1',
        COLUMNS[columns],
        className,
      )}
    >
      {children}
    </dl>
  );
}

export type StatTone = 'neutral' | 'positive' | 'negative' | 'warning';

const CAPTION_TONES: Record<StatTone, string> = {
  neutral: 'text-stone-500',
  positive: 'text-emerald-700',
  negative: 'text-red-700',
  warning: 'text-amber-700',
};

export interface StatCardProps {
  label: ReactNode;
  value: ReactNode;
  /** A short line under the figure, e.g. "Awaiting a reply" or "+12% vs last month". */
  caption?: ReactNode;
  /** Colours the caption: good news, bad news or something to act on. */
  tone?: StatTone;
  icon?: LucideIcon;
  /** The full value as text, shown on hover when a long figure is truncated. */
  valueTitle?: string;
  className?: string;
}

/** One figure in a {@link StatStrip}: a label, a big number and an optional caption. */
export function StatCard({
  label,
  value,
  caption,
  tone = 'neutral',
  icon: Icon,
  valueTitle,
  className,
}: StatCardProps) {
  return (
    <div className={cn('min-w-0 bg-surface p-4 sm:p-5', className)}>
      <dt className="flex items-start justify-between gap-2 text-[13px] text-stone-500">
        {label}
        {Icon && <Icon aria-hidden="true" className="size-4 shrink-0 text-stone-400" />}
      </dt>
      <dd
        title={valueTitle}
        className="mt-1 truncate font-display text-2xl font-semibold tracking-tight text-stone-900 tabular-nums sm:text-[1.75rem]"
      >
        {value}
      </dd>
      {caption && <dd className={cn('mt-1 text-xs', CAPTION_TONES[tone])}>{caption}</dd>}
    </div>
  );
}

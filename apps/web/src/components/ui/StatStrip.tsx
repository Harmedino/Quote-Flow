import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

const LAYOUTS = {
  2: 'ticket-row',
  3: 'ticket-row',
  // Phones: the first figure on its own, the other three side by side under it.
  4: 'max-lg:ticket-split lg:ticket-row',
} as const;

export interface StatStripProps {
  /** How many figures. Four become one plus three on phones and tablets. */
  columns?: keyof typeof LAYOUTS;
  /** Names the group for assistive technology, e.g. "Quotes this month". */
  label?: string;
  className?: string;
  /** StatCard elements. */
  children: ReactNode;
}

/**
 * Key figures as one perforated receipt strip: ticket parts joined by dashed seams, with
 * notches where the seams meet the edge.
 */
export function StatStrip({ columns = 4, label, className, children }: StatStripProps) {
  return (
    <dl aria-label={label} className={cn('lift animate-fade-in-up', LAYOUTS[columns], className)}>
      {children}
    </dl>
  );
}

export type StatTone = 'neutral' | 'positive' | 'negative' | 'warning';

const CAPTION_TONES: Record<StatTone, string> = {
  neutral: 'text-muted',
  positive: 'text-success',
  negative: 'font-semibold text-overdue',
  warning: 'text-warning',
};

export interface StatCardProps {
  label: ReactNode;
  value: ReactNode;
  /** Small text after the figure, e.g. "quotes" or "of ₦1M". */
  unit?: ReactNode;
  /**
   * A short line under the figure, e.g. "3 sent · 1 viewed", a link, or a TapeMeasure with its
   * percentage.
   */
  caption?: ReactNode;
  /** Colours the caption: good news, bad news or something to act on. */
  tone?: StatTone;
  icon?: LucideIcon;
  /** The full value as text, shown on hover when a long figure is truncated. */
  valueTitle?: string;
  className?: string;
}

/**
 * One part of a {@link StatStrip}: a mono label, a wide heavy figure and an optional caption.
 * The figure scales with the part's width (a container query), so it fits three across a phone;
 * there the icon steps aside and the unit wraps under the figure.
 */
export function StatCard({
  label,
  value,
  unit,
  caption,
  tone = 'neutral',
  icon: Icon,
  valueTitle,
  className,
}: StatCardProps) {
  return (
    <div className={cn('@container px-3.5 pt-3.5 pb-4 sm:px-5.5 sm:pt-4.5', className)}>
      <dt className="flex items-center justify-between gap-2 label-mono text-muted max-sm:text-[10.5px] max-sm:tracking-[0.07em]">
        <span className="min-w-0 truncate">{label}</span>
        {Icon && <Icon aria-hidden="true" className="hidden size-[18px] shrink-0 @[12rem]:block" />}
      </dt>
      <dd
        title={valueTitle}
        className="mt-2.5 flex min-w-0 flex-wrap items-baseline gap-x-1.5 gap-y-1 figure text-xl text-ink @[11rem]:text-[1.625rem] @[15rem]:text-[2rem]"
      >
        <span className="truncate">{value}</span>
        {unit && (
          <span className="shrink-0 text-[13px] font-[650] tracking-normal font-stretch-100% text-muted @[15rem]:text-base">
            {unit}
          </span>
        )}
      </dd>
      {caption && (
        <dd className={cn('mt-2.5 text-xs leading-snug @[15rem]:text-[13px]', CAPTION_TONES[tone])}>
          {caption}
        </dd>
      )}
    </div>
  );
}

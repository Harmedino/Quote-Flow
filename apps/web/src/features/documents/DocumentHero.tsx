import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

/**
 * The stub's colour says where the document stands: orange while it is in play, green once it is
 * settled (accepted or paid), sunken once it ended without (declined, expired, cancelled), and red
 * with the hazard edge while it is overdue.
 */
const STUB_TONES = {
  open: 'bg-primary-tint',
  settled: 'bg-accepted-tint',
  ended: 'bg-surface-muted',
  overdue: 'bg-overdue-tint',
} as const;

export type DocumentHeroTone = keyof typeof STUB_TONES;

export interface DocumentHeroProps {
  /** What the figure is, e.g. "Quote total" or "Balance due". */
  label: string;
  /** The formatted amount. */
  amount: string;
  /** A line under the figure: validity, due date or how it ended. */
  detail?: ReactNode;
  tone?: DocumentHeroTone;
  /** The ticket's second part, e.g. the progress or how much is paid. */
  children?: ReactNode;
  className?: string;
}

/**
 * The top of a quote or invoice page as a ticket: a stub with the one figure that matters, then,
 * beyond the perforation, where the document stands. Stacked on phones, side by side from `sm`.
 */
export function DocumentHero({
  label,
  amount,
  detail,
  tone = 'open',
  children,
  className,
}: DocumentHeroProps) {
  const overdue = tone === 'overdue';
  const hasProgress = Boolean(children);
  return (
    <section
      aria-label={label}
      className={cn('animate-fade-in-up lift max-sm:ticket-col sm:ticket-row', className)}
    >
      <div
        className={cn(
          '@container relative px-5 py-5 sm:px-6',
          STUB_TONES[tone],
          hasProgress && 'sm:grow-0 sm:basis-[42%]',
        )}
      >
        {overdue && (
          <span
            aria-hidden="true"
            className="absolute inset-y-0 left-0 w-2.5 hazard-tape-overdue opacity-55"
          />
        )}
        <p className="label-mono text-ink-2">{label}</p>
        <p className="mt-2.5 figure text-[1.75rem] wrap-anywhere text-ink @[18rem]:text-[2.125rem]">
          {amount}
        </p>
        {detail && (
          <p
            className={cn(
              'mt-2.5 text-[13.5px] text-pretty',
              overdue ? 'font-semibold text-overdue' : 'text-ink-2',
            )}
          >
            {detail}
          </p>
        )}
      </div>
      {hasProgress && <div className="min-w-0 px-5 py-5 sm:px-6">{children}</div>}
    </section>
  );
}

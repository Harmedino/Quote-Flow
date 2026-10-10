import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export interface DocumentHeroProps {
  /** What the figure is, e.g. "Quote total" or "Balance due". */
  label: string;
  /** The formatted amount. */
  amount: string;
  /** Lines under the figure: validity, due date, payment progress. */
  children?: ReactNode;
  className?: string;
}

/** The ink panel at the top of a quote or invoice page: the one figure that matters, large. */
export function DocumentHero({ label, amount, children, className }: DocumentHeroProps) {
  return (
    <section
      aria-label={label}
      className={cn(
        'rounded-2xl bg-ink p-6 text-white sm:p-7 dark:ring-1 dark:ring-white/10',
        className,
      )}
    >
      <p className="text-xs font-medium tracking-wider text-white/60 uppercase">{label}</p>
      <p className="mt-2 font-display text-4xl font-semibold tracking-tight wrap-anywhere tabular-nums sm:text-5xl">
        {amount}
      </p>
      {children}
    </section>
  );
}

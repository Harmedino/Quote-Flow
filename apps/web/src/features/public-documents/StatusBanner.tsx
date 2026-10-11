import { Check, CircleAlert, Clock, Info, type LucideIcon, X } from 'lucide-react';
import type { ReactNode, Ref } from 'react';
import { cn } from '@/lib/cn';
import type { BannerTone, StatusBannerModel } from './public-status';

/** An icon tile per tone, in the status colours; the card stays ticket stock. */
const TONES: Record<BannerTone, { icon: LucideIcon; tile: string }> = {
  success: { icon: Check, tile: 'bg-paid-fill text-white' },
  info: { icon: Info, tile: 'bg-sent-tint text-sent' },
  warning: { icon: Clock, tile: 'bg-expired-tint text-expired' },
  danger: { icon: CircleAlert, tile: 'bg-overdue-fill text-white' },
  neutral: { icon: X, tile: 'bg-draft-tint text-draft' },
};

export interface StatusBannerProps {
  banner: StatusBannerModel;
  /** Extra content under the message, e.g. the customer's own note. */
  children?: ReactNode;
  className?: string;
  /** Focused after the customer answers, so screen readers read the outcome. */
  ref?: Ref<HTMLElement>;
}

/**
 * A prominent, announced summary of where the document stands, above its ticket. An overdue
 * banner carries the red hazard stripe along its edge.
 */
export function StatusBanner({ banner, children, className, ref }: StatusBannerProps) {
  const { icon: Icon, tile } = TONES[banner.tone];
  return (
    <section
      ref={ref}
      role="status"
      tabIndex={-1}
      className={cn(
        'relative animate-fade-in-up overflow-hidden rounded-xl bg-surface p-4 shadow-(--shadow-elevated) focus:outline-none sm:p-5 print:hidden',
        className,
      )}
    >
      {banner.tone === 'danger' && (
        <span
          aria-hidden="true"
          className="absolute inset-y-0 right-0 w-2.5 hazard-tape-overdue opacity-55"
        />
      )}
      <div className="flex items-start gap-3.5">
        <span
          aria-hidden="true"
          className={cn(
            'flex size-10 shrink-0 animate-spin-in items-center justify-center rounded-[10px]',
            tile,
          )}
        >
          <Icon className="size-5" strokeWidth={2.75} />
        </span>
        <div className="min-w-0 pt-0.5">
          <h2 className="heading-card text-ink">{banner.title}</h2>
          <p className="mt-1 text-[14.5px] text-pretty text-ink-2">{banner.message}</p>
          {children && <div className="mt-3">{children}</div>}
        </div>
      </div>
    </section>
  );
}

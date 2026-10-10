import { Check, CircleAlert, Clock, Info, type LucideIcon, X } from 'lucide-react';
import type { ReactNode, Ref } from 'react';
import { cn } from '@/lib/cn';
import type { BannerTone, StatusBannerModel } from './public-status';

/** A filled icon circle per tone; the card itself stays neutral so it reads in both themes. */
const TONES: Record<BannerTone, { icon: LucideIcon; circle: string }> = {
  success: { icon: Check, circle: 'bg-green-600 text-white' },
  info: { icon: Info, circle: 'bg-blue-600 text-white' },
  warning: { icon: Clock, circle: 'bg-amber-500 text-ink' },
  danger: { icon: CircleAlert, circle: 'bg-red-600 text-white' },
  neutral: { icon: X, circle: 'bg-stone-200 text-stone-700' },
};

export interface StatusBannerProps {
  banner: StatusBannerModel;
  /** Extra content under the message, e.g. the customer's own note. */
  children?: ReactNode;
  className?: string;
  /** Focused after the customer answers, so screen readers read the outcome. */
  ref?: Ref<HTMLElement>;
}

/** A prominent, announced summary of where the document stands. */
export function StatusBanner({ banner, children, className, ref }: StatusBannerProps) {
  const { icon: Icon, circle } = TONES[banner.tone];
  return (
    <section
      ref={ref}
      role="status"
      tabIndex={-1}
      className={cn(
        'animate-fade-in-up rounded-3xl border border-stone-200 bg-surface p-5 focus:outline-none sm:p-6 print:hidden',
        className,
      )}
    >
      <div className="flex items-start gap-4">
        <span
          aria-hidden="true"
          className={cn(
            'flex size-10 shrink-0 animate-spin-in items-center justify-center rounded-full',
            circle,
          )}
        >
          <Icon className="size-5" strokeWidth={2.75} />
        </span>
        <div className="min-w-0 pt-0.5">
          <h2 className="text-xl font-semibold text-stone-900">{banner.title}</h2>
          <p className="mt-1 text-sm/6 text-pretty text-stone-600">{banner.message}</p>
          {children && <div className="mt-4">{children}</div>}
        </div>
      </div>
    </section>
  );
}

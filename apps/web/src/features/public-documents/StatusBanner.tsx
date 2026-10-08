import { CircleAlert, CircleCheck, CircleX, Clock, Info, type LucideIcon } from 'lucide-react';
import type { ReactNode, Ref } from 'react';
import { cn } from '@/lib/cn';
import type { BannerTone, StatusBannerModel } from './public-status';

const TONES: Record<BannerTone, { icon: LucideIcon; surface: string; badge: string }> = {
  success: {
    icon: CircleCheck,
    surface: 'bg-emerald-50 ring-emerald-600/20',
    badge: 'bg-emerald-600 text-white',
  },
  info: { icon: Info, surface: 'bg-sky-50 ring-sky-600/20', badge: 'bg-sky-600 text-white' },
  warning: {
    icon: Clock,
    surface: 'bg-amber-50 ring-amber-600/25',
    badge: 'bg-amber-500 text-white',
  },
  danger: {
    icon: CircleAlert,
    surface: 'bg-red-50 ring-red-600/20',
    badge: 'bg-red-600 text-white',
  },
  neutral: { icon: CircleX, surface: 'bg-white ring-zinc-900/10', badge: 'bg-zinc-700 text-white' },
};

export interface StatusBannerProps {
  banner: StatusBannerModel;
  /** Extra content under the message, e.g. contact links or the customer's own note. */
  children?: ReactNode;
  className?: string;
  /** Focused after the customer answers, so screen readers read the outcome. */
  ref?: Ref<HTMLElement>;
}

/** A prominent, announced summary of where the document stands. */
export function StatusBanner({ banner, children, className, ref }: StatusBannerProps) {
  const { icon: Icon, surface, badge } = TONES[banner.tone];
  return (
    <section
      ref={ref}
      role="status"
      tabIndex={-1}
      className={cn(
        'animate-fade-in rounded-2xl p-5 ring-1 ring-inset focus:outline-none sm:p-6 print:hidden',
        surface,
        className,
      )}
    >
      <div className="flex gap-4">
        <span
          aria-hidden="true"
          className={cn('flex size-10 shrink-0 items-center justify-center rounded-full', badge)}
        >
          <Icon className="size-5" strokeWidth={2.25} />
        </span>
        <div className="min-w-0 pt-0.5">
          <h2 className="text-base font-semibold text-zinc-950">{banner.title}</h2>
          <p className="mt-1 text-sm/6 text-pretty text-zinc-700">{banner.message}</p>
          {children && <div className="mt-4">{children}</div>}
        </div>
      </div>
    </section>
  );
}

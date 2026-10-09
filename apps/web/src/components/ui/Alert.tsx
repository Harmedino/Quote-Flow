import { CircleAlert, CircleCheck, Info, type LucideIcon, TriangleAlert } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export type AlertTone = 'info' | 'success' | 'warning' | 'danger';
export type AlertVariant = 'panel' | 'banner';

interface ToneStyle {
  icon: LucideIcon;
  panel: string;
  iconColor: string;
  title: string;
  banner: string;
}

const TONES: Record<AlertTone, ToneStyle> = {
  info: {
    icon: Info,
    panel: 'bg-blue-50 ring-blue-600/20',
    iconColor: 'text-blue-600',
    title: 'text-blue-800',
    banner: 'border-blue-400 bg-blue-50/70',
  },
  success: {
    icon: CircleCheck,
    panel: 'bg-emerald-50 ring-emerald-600/20',
    iconColor: 'text-emerald-600',
    title: 'text-emerald-800',
    banner: 'border-brand-400 bg-brand-50/70',
  },
  warning: {
    icon: TriangleAlert,
    panel: 'bg-amber-50 ring-amber-600/25',
    iconColor: 'text-amber-600',
    title: 'text-amber-800',
    banner: 'border-amber-400 bg-amber-50/70',
  },
  danger: {
    icon: CircleAlert,
    panel: 'bg-red-50 ring-red-600/20',
    iconColor: 'text-red-600',
    title: 'text-red-800',
    banner: 'border-red-400 bg-red-50/70',
  },
};

export interface AlertProps {
  tone?: AlertTone;
  /**
   * `panel` (default) is a boxed message with an icon, for form and load errors. `banner` is a
   * slim line with a coloured left edge, for a page-level heads-up such as "2 invoices are overdue".
   */
  variant?: AlertVariant;
  title?: ReactNode;
  children?: ReactNode;
  /** A link or button at the end, e.g. "Review invoices". */
  action?: ReactNode;
  className?: string;
}

export function Alert({
  tone = 'info',
  variant = 'panel',
  title,
  children,
  action,
  className,
}: AlertProps) {
  const style = TONES[tone];
  const urgent = tone === 'danger' || tone === 'warning';
  const role = urgent ? 'alert' : 'status';

  if (variant === 'banner') {
    return (
      <div
        role={role}
        className={cn(
          'flex flex-wrap items-center justify-between gap-x-4 gap-y-1.5 rounded-r-lg border-l-2 px-4 py-2.5 text-sm text-stone-700',
          style.banner,
          className,
        )}
      >
        <div className="min-w-0">
          {title && <span className="font-semibold text-stone-900">{title} </span>}
          {children}
        </div>
        {action && <div className="shrink-0 font-medium">{action}</div>}
      </div>
    );
  }

  const Icon = style.icon;
  return (
    <div
      role={role}
      className={cn(
        'flex gap-3 rounded-xl p-4 text-sm text-stone-700 ring-1 ring-inset',
        style.panel,
        className,
      )}
    >
      <Icon aria-hidden="true" className={cn('size-5 shrink-0', style.iconColor)} />
      <div className="min-w-0 flex-1 space-y-1">
        {title && <p className={cn('font-semibold', style.title)}>{title}</p>}
        {children && <div>{children}</div>}
        {action && <div className="pt-1 font-medium">{action}</div>}
      </div>
    </div>
  );
}

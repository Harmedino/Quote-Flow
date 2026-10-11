import { CircleAlert, CircleCheck, Info, type LucideIcon, TriangleAlert } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export type AlertTone = 'info' | 'success' | 'warning' | 'danger';
export type AlertVariant = 'panel' | 'banner';

interface ToneStyle {
  icon: LucideIcon;
  /** Background wash. */
  tint: string;
  /** Icon and title colour. */
  text: string;
  /** The banner's left edge: danger gets the red hazard tape. */
  edge: string;
}

const TONES: Record<AlertTone, ToneStyle> = {
  info: { icon: Info, tint: 'bg-info-tint', text: 'text-info', edge: 'bg-info' },
  success: { icon: CircleCheck, tint: 'bg-success-tint', text: 'text-success', edge: 'bg-success' },
  warning: {
    icon: TriangleAlert,
    tint: 'bg-warning-tint',
    text: 'text-warning',
    edge: 'bg-warning',
  },
  danger: {
    icon: CircleAlert,
    tint: 'bg-danger-tint',
    text: 'text-danger',
    edge: 'hazard-tape-overdue',
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
          'relative flex flex-wrap items-center justify-between gap-x-4 gap-y-1.5 overflow-hidden rounded-[10px] py-2.5 pr-4 pl-5 text-sm text-ink-2',
          style.tint,
          className,
        )}
      >
        <span aria-hidden="true" className={cn('absolute inset-y-0 left-0 w-1', style.edge)} />
        <div className="min-w-0">
          {title && <span className="font-bold text-ink">{title} </span>}
          {children}
        </div>
        {action && <div className="shrink-0 font-semibold">{action}</div>}
      </div>
    );
  }

  const Icon = style.icon;
  return (
    <div
      role={role}
      className={cn('flex gap-3 rounded-xl p-4 text-sm text-ink-2', style.tint, className)}
    >
      <Icon aria-hidden="true" className={cn('size-5 shrink-0', style.text)} />
      <div className="min-w-0 flex-1 space-y-1">
        {title && <p className={cn('font-bold', style.text)}>{title}</p>}
        {children && <div>{children}</div>}
        {action && <div className="pt-1 font-semibold">{action}</div>}
      </div>
    </div>
  );
}

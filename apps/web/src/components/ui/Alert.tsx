import { CircleAlert, CircleCheck, Info, type LucideIcon, TriangleAlert } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export type AlertTone = 'info' | 'success' | 'warning' | 'danger';

interface ToneStyle {
  icon: LucideIcon;
  surface: string;
  iconColor: string;
}

const TONES: Record<AlertTone, ToneStyle> = {
  info: {
    icon: Info,
    surface: 'bg-sky-50 text-sky-900 ring-sky-600/20',
    iconColor: 'text-sky-600',
  },
  success: {
    icon: CircleCheck,
    surface: 'bg-emerald-50 text-emerald-900 ring-emerald-600/20',
    iconColor: 'text-emerald-600',
  },
  warning: {
    icon: TriangleAlert,
    surface: 'bg-amber-50 text-amber-900 ring-amber-600/25',
    iconColor: 'text-amber-600',
  },
  danger: {
    icon: CircleAlert,
    surface: 'bg-red-50 text-red-900 ring-red-600/20',
    iconColor: 'text-red-600',
  },
};

export interface AlertProps {
  tone?: AlertTone;
  title?: ReactNode;
  children?: ReactNode;
  className?: string;
}

export function Alert({ tone = 'info', title, children, className }: AlertProps) {
  const { icon: Icon, surface, iconColor } = TONES[tone];
  const urgent = tone === 'danger' || tone === 'warning';

  return (
    <div
      role={urgent ? 'alert' : 'status'}
      className={cn('flex gap-3 rounded-lg p-4 text-sm ring-1 ring-inset', surface, className)}
    >
      <Icon aria-hidden="true" className={cn('size-5 shrink-0', iconColor)} />
      <div className="min-w-0 space-y-1">
        {title && <p className="font-medium">{title}</p>}
        {children && <div>{children}</div>}
      </div>
    </div>
  );
}

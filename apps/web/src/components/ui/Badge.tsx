import type { ComponentProps } from 'react';
import { cn } from '@/lib/cn';

export type BadgeTone = 'neutral' | 'brand' | 'success' | 'warning' | 'danger' | 'info' | 'accent';

// Tinted washes whose text shades lighten in dark mode (see styles/index.css).
const TONES: Record<BadgeTone, string> = {
  neutral: 'bg-stone-100 text-stone-600',
  brand: 'bg-brand-50 text-brand-700',
  success: 'bg-green-50 text-green-700',
  warning: 'bg-amber-50 text-amber-700',
  danger: 'bg-red-50 text-red-700',
  info: 'bg-blue-50 text-blue-700',
  /** A distinct colour for a state that is neither good nor bad news, e.g. a viewed quote. */
  accent: 'bg-violet-50 text-violet-700',
};

export interface BadgeProps extends ComponentProps<'span'> {
  tone?: BadgeTone;
}

export function Badge({ tone = 'neutral', className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap',
        TONES[tone],
        className,
      )}
      {...props}
    />
  );
}

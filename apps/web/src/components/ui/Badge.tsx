import type { ComponentProps } from 'react';
import { cn } from '@/lib/cn';

export type BadgeTone = 'neutral' | 'brand' | 'success' | 'warning' | 'danger' | 'info' | 'accent';

const TONES: Record<BadgeTone, string> = {
  neutral: 'bg-draft-tint text-draft',
  brand: 'bg-primary-tint text-primary-ink',
  success: 'bg-success-tint text-success',
  warning: 'bg-warning-tint text-warning',
  danger: 'bg-danger-tint text-danger',
  info: 'bg-info-tint text-info',
  /** A distinct colour for a state that is neither good nor bad news, e.g. a viewed quote. */
  accent: 'bg-viewed-tint text-viewed',
};

export interface BadgeProps extends ComponentProps<'span'> {
  tone?: BadgeTone;
}

/**
 * A small mono label such as "Owner" or "Archived". Document statuses use the hang-tag chips in
 * components/StatusBadge instead.
 */
export function Badge({ tone = 'neutral', className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex h-5.5 shrink-0 items-center gap-1 rounded-[5px] px-2 font-mono text-[10.5px] leading-none font-semibold tracking-[0.07em] whitespace-nowrap uppercase [&_svg]:size-3',
        TONES[tone],
        className,
      )}
      {...props}
    />
  );
}

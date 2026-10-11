import type { CSSProperties } from 'react';
import { cn } from '@/lib/cn';

const SIZES = {
  sm: 'h-2.5',
  md: 'h-3',
} as const;

export interface TapeMeasureProps {
  /** How far along, from 0 to 1 (values outside are clamped). */
  value: number;
  /** What it measures, e.g. "₦807,997 of ₦1M invoiced is collected". */
  label: string;
  size?: keyof typeof SIZES;
  className?: string;
}

/**
 * Progress as an orange tape-measure blade with major and minor ticks, e.g. collected of
 * invoiced or paid of an invoice. It is pulled out with a short overshoot when it appears.
 */
export function TapeMeasure({ value, label, size = 'md', className }: TapeMeasureProps) {
  const percent = Math.round(Math.min(1, Math.max(0, value)) * 1000) / 10;
  return (
    <div
      role="meter"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percent}
      aria-valuetext={`${Math.round(percent)}%`}
      style={{ '--value': `${percent}%` } as CSSProperties}
      className={cn('tape-measure', SIZES[size], className)}
    />
  );
}

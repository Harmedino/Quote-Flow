import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

const SIZES = {
  md: 'h-5 min-w-5 px-1.5 text-[11px]',
  /** A badge on a phone tab icon. */
  sm: 'h-[17px] min-w-[17px] px-1 text-[10.5px]',
} as const;

const TONES = {
  neutral: 'bg-surface-muted text-ink-2 shadow-[inset_0_0_0_1px_var(--color-line)]',
  /** Solid red, for counts that need action (overdue invoices). */
  alert: 'bg-overdue-fill text-white',
} as const;

export interface CountChipProps {
  children: ReactNode;
  tone?: keyof typeof TONES;
  size?: keyof typeof SIZES;
  /** What is counted, for screen readers, e.g. "overdue" reads "Invoices, 2 overdue". */
  label?: string;
  className?: string;
}

/** A small mono count beside a tab or nav label, e.g. "Quotes 4". */
export function CountChip({
  children,
  tone = 'neutral',
  size = 'md',
  label,
  className,
}: CountChipProps) {
  return (
    <span
      className={cn(
        'inline-grid shrink-0 place-items-center rounded-[5px] font-mono leading-none font-semibold tabular-nums',
        SIZES[size],
        TONES[tone],
        className,
      )}
    >
      <span>
        {label && <span className="sr-only">, </span>}
        {children}
        {label && <span className="sr-only"> {label}</span>}
      </span>
    </span>
  );
}

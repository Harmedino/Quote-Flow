import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export type StampTone =
  | 'accepted'
  | 'paid'
  | 'declined'
  | 'overdue'
  | 'expired'
  | 'sent'
  | 'viewed'
  | 'partial'
  | 'draft';

const TONES: Record<StampTone, string> = {
  accepted: 'text-accepted',
  paid: 'text-paid',
  declined: 'text-declined',
  overdue: 'text-overdue',
  expired: 'text-expired',
  sent: 'text-sent',
  viewed: 'text-viewed',
  partial: 'text-partial',
  // Not final yet, so the frame is dashed.
  draft: 'text-draft [--stamp-line:dashed]',
};

export interface StampProps {
  tone: StampTone;
  /** The word on the stamp, e.g. "Accepted". It is set in capitals by CSS. */
  children: ReactNode;
  /** A mono line under it, e.g. "Oct 5 · 10:47". */
  detail?: ReactNode;
  /** Drops the stamp in with a thump: use it when the status has just changed. */
  animate?: boolean;
  className?: string;
}

/**
 * A rubber stamp on a ticket for the customer's answer or a settled invoice: double-ruled, tilted
 * and inked with a little grain.
 */
export function Stamp({ tone, children, detail, animate = false, className }: StampProps) {
  return (
    <span className={cn('stamp', TONES[tone], animate && 'animate-stamp-thump', className)}>
      <span>{children}</span>
      {detail && (
        <small className="font-mono text-[9.5px] font-semibold tracking-[0.1em] font-stretch-100%">
          {detail}
        </small>
      )}
    </span>
  );
}

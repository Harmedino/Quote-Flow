import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export type HangTagTone =
  | 'draft'
  | 'sent'
  | 'viewed'
  | 'accepted'
  | 'declined'
  | 'expired'
  | 'partial'
  | 'overdue'
  | 'paid';

/** Tinted tags, except the two money outcomes (overdue and paid), which are solid. */
const TONES: Record<HangTagTone, string> = {
  draft: 'bg-draft-tint text-draft',
  sent: 'bg-sent-tint text-sent',
  viewed: 'bg-viewed-tint text-viewed',
  accepted: 'bg-accepted-tint text-accepted',
  declined: 'bg-declined-tint text-declined',
  expired: 'bg-expired-tint text-expired',
  partial: 'bg-partial-tint text-partial',
  overdue: 'bg-overdue-fill text-white',
  paid: 'bg-paid-fill text-white',
};

export interface HangTagProps {
  /** Pick a tone, or leave it out and colour the tag with `className` (e.g. a brand tint). */
  tone?: HangTagTone;
  children: ReactNode;
  className?: string;
}

/**
 * A status as a small luggage tag: mono capitals on a tint, with an angled end and a punched
 * hole. The word is the status, so colour is never the only signal.
 */
export function HangTag({ tone, children, className }: HangTagProps) {
  return <span className={cn('hang-tag', tone && TONES[tone], className)}>{children}</span>;
}

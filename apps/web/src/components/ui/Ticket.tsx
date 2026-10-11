import type { ComponentProps } from 'react';
import { cn } from '@/lib/cn';

const ORIENTATIONS = {
  vertical: 'ticket-col',
  horizontal: 'ticket-row',
} as const;

const LIFTS = {
  normal: 'lift',
  /** For a ticket that floats above the page, e.g. a hero or the customer's quote. */
  high: 'lift-high',
  none: '',
} as const;

export interface TicketProps extends ComponentProps<'div'> {
  /** `vertical` (default) stacks the parts; `horizontal` sets them side by side. */
  orientation?: keyof typeof ORIENTATIONS;
  lift?: keyof typeof LIFTS;
}

/**
 * A job ticket: each direct child is a part on ticket stock, joined to the next by a dashed
 * perforation with notches cut where it meets the edge. Use TicketPart for the parts, or any
 * element. For other arrangements (stub on top on phones, beside the body from `sm`), use the
 * ticket-col / ticket-row / ticket-split utilities with variants instead of `orientation`.
 */
export function Ticket({
  orientation = 'vertical',
  lift = 'normal',
  className,
  ...props
}: TicketProps) {
  return <div className={cn(ORIENTATIONS[orientation], LIFTS[lift], className)} {...props} />;
}

const PART_TONES = {
  surface: '',
  /** The stub that carries the number: an orange tint. */
  stub: 'bg-primary-tint',
  /** Sunken, e.g. a totals block. */
  muted: 'bg-surface-muted',
} as const;

export interface TicketPartProps extends ComponentProps<'div'> {
  tone?: keyof typeof PART_TONES;
}

/** One part of a {@link Ticket}. Pad it yourself (e.g. `p-5`). */
export function TicketPart({ tone = 'surface', className, ...props }: TicketPartProps) {
  return <div className={cn(PART_TONES[tone], className)} {...props} />;
}

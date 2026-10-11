import {
  INVOICE_STATUS_LABELS,
  type InvoiceStatus,
  QUOTE_STATUS_LABELS,
  type QuoteStatus,
} from '@quoteflow/shared';
import { HangTag, type HangTagTone } from '@/components/ui/HangTag';
import { cn } from '@/lib/cn';

const QUOTE_TONES: Record<QuoteStatus, HangTagTone> = {
  draft: 'draft',
  sent: 'sent',
  // Teal, not green, so a viewed quote never reads as accepted.
  viewed: 'viewed',
  accepted: 'accepted',
  rejected: 'declined',
  expired: 'expired',
};

const INVOICE_TONES: Record<InvoiceStatus, HangTagTone> = {
  draft: 'draft',
  sent: 'sent',
  partially_paid: 'partial',
  paid: 'paid',
  overdue: 'overdue',
  cancelled: 'draft',
};

/** A quote's status as a hang-tag chip. */
export function QuoteStatusBadge({ status }: { status: QuoteStatus }) {
  return <HangTag tone={QUOTE_TONES[status]}>{QUOTE_STATUS_LABELS[status]}</HangTag>;
}

/** An invoice's status as a hang-tag chip: solid red when overdue, solid green when paid. */
export function InvoiceStatusBadge({ status }: { status: InvoiceStatus }) {
  return <HangTag tone={INVOICE_TONES[status]}>{INVOICE_STATUS_LABELS[status]}</HangTag>;
}

const ACCENTS: Record<HangTagTone, string> = {
  draft: 'bg-line-strong',
  sent: 'bg-sent',
  viewed: 'bg-viewed',
  accepted: 'bg-accepted',
  declined: 'bg-declined',
  expired: 'bg-expired',
  partial: 'bg-partial',
  // Overdue rows carry the red hazard tape.
  overdue: 'hazard-tape-overdue',
  paid: 'bg-paid-fill',
};

/** A thin status-coloured edge at the start of a list row. Decorative: the tag names the status. */
function StatusAccent({ tone }: { tone: HangTagTone }) {
  return (
    <span
      aria-hidden="true"
      className={cn('w-1 shrink-0 self-stretch rounded-full', ACCENTS[tone])}
    />
  );
}

export function QuoteStatusAccent({ status }: { status: QuoteStatus }) {
  return <StatusAccent tone={QUOTE_TONES[status]} />;
}

export function InvoiceStatusAccent({ status }: { status: InvoiceStatus }) {
  return <StatusAccent tone={INVOICE_TONES[status]} />;
}

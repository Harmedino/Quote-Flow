import {
  INVOICE_STATUS_LABELS,
  type InvoiceStatus,
  QUOTE_STATUS_LABELS,
  type QuoteStatus,
} from '@quoteflow/shared';
import { Badge, type BadgeTone } from '@/components/ui/Badge';
import { cn } from '@/lib/cn';

const QUOTE_TONES: Record<QuoteStatus, BadgeTone> = {
  draft: 'neutral',
  sent: 'info',
  // Not green, so a viewed quote never reads as accepted.
  viewed: 'accent',
  accepted: 'success',
  rejected: 'danger',
  expired: 'warning',
};

const INVOICE_TONES: Record<InvoiceStatus, BadgeTone> = {
  draft: 'neutral',
  sent: 'info',
  partially_paid: 'warning',
  paid: 'success',
  overdue: 'danger',
  cancelled: 'neutral',
};

const QUOTE_ACCENTS: Record<QuoteStatus, string> = {
  draft: 'bg-stone-300',
  sent: 'bg-blue-400',
  viewed: 'bg-violet-400',
  accepted: 'bg-green-500',
  rejected: 'bg-red-400',
  expired: 'bg-amber-400',
};

const INVOICE_ACCENTS: Record<InvoiceStatus, string> = {
  draft: 'bg-stone-300',
  sent: 'bg-blue-400',
  partially_paid: 'bg-amber-400',
  paid: 'bg-green-500',
  overdue: 'bg-red-400',
  cancelled: 'bg-stone-300',
};

export function QuoteStatusBadge({ status }: { status: QuoteStatus }) {
  return <Badge tone={QUOTE_TONES[status]}>{QUOTE_STATUS_LABELS[status]}</Badge>;
}

export function InvoiceStatusBadge({ status }: { status: InvoiceStatus }) {
  return <Badge tone={INVOICE_TONES[status]}>{INVOICE_STATUS_LABELS[status]}</Badge>;
}

/** A thin status-coloured bar at the start of a list row. Decorative: the badge names the status. */
function StatusAccent({ color }: { color: string }) {
  return (
    <span aria-hidden="true" className={cn('w-0.5 shrink-0 self-stretch rounded-full', color)} />
  );
}

export function QuoteStatusAccent({ status }: { status: QuoteStatus }) {
  return <StatusAccent color={QUOTE_ACCENTS[status]} />;
}

export function InvoiceStatusAccent({ status }: { status: InvoiceStatus }) {
  return <StatusAccent color={INVOICE_ACCENTS[status]} />;
}

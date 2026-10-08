import {
  INVOICE_STATUS_LABELS,
  type InvoiceStatus,
  QUOTE_STATUS_LABELS,
  type QuoteStatus,
} from '@quoteflow/shared';
import { Badge, type BadgeTone } from '@/components/ui/Badge';

const QUOTE_TONES: Record<QuoteStatus, BadgeTone> = {
  draft: 'neutral',
  sent: 'info',
  viewed: 'brand',
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

export function QuoteStatusBadge({ status }: { status: QuoteStatus }) {
  return <Badge tone={QUOTE_TONES[status]}>{QUOTE_STATUS_LABELS[status]}</Badge>;
}

export function InvoiceStatusBadge({ status }: { status: InvoiceStatus }) {
  return <Badge tone={INVOICE_TONES[status]}>{INVOICE_STATUS_LABELS[status]}</Badge>;
}

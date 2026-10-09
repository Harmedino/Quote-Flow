import { QUOTE_STATUS_LABELS, type QuoteDto } from '@quoteflow/shared';
import { daysBetween } from '@/features/dashboard/dashboard-format';
import { formatCalendarDate, formatDate } from '@/lib/format';

type QuoteDates = Pick<QuoteDto, 'status' | 'expiryDate' | 'acceptedAt' | 'rejectedAt'>;

/**
 * One line under a quote's total saying where it stands: how long it is still valid, or how it
 * ended. `today` is 'YYYY-MM-DD' in the business time zone.
 */
export function quoteOutlook(quote: QuoteDates, today: string, timeZone: string): string {
  const expiry = formatCalendarDate(quote.expiryDate);
  if (quote.status === 'accepted' && quote.acceptedAt) {
    return `Accepted on ${formatDate(quote.acceptedAt, { timeZone })}`;
  }
  if (quote.status === 'rejected' && quote.rejectedAt) {
    return `Rejected on ${formatDate(quote.rejectedAt, { timeZone })}`;
  }
  if (quote.status === 'expired') return `Expired after ${expiry}`;

  const days = daysBetween(today, quote.expiryDate);
  if (days === 0) return `Valid until ${expiry} · last day today`;
  if (days > 0) return `Valid until ${expiry} · ${days} ${days === 1 ? 'day' : 'days'} left`;
  return `Valid until ${expiry}`;
}

export interface QuoteStep {
  label: string;
  /** `stopped`: the quote ended here (rejected or expired). */
  state: 'done' | 'todo' | 'stopped';
}

type QuoteProgress = Pick<QuoteDto, 'status' | 'sentAt' | 'viewedAt' | 'invoiceId'>;

/** The road from draft to invoice, and how far the quote has come along it. */
export function quoteSteps(quote: QuoteProgress): QuoteStep[] {
  const start: QuoteStep[] = [
    { label: 'Created', state: 'done' },
    { label: 'Sent', state: quote.sentAt ? 'done' : 'todo' },
    { label: 'Viewed', state: quote.viewedAt ? 'done' : 'todo' },
  ];
  if (quote.status === 'rejected' || quote.status === 'expired') {
    return [...start, { label: QUOTE_STATUS_LABELS[quote.status], state: 'stopped' }];
  }
  return [
    ...start,
    { label: 'Accepted', state: quote.status === 'accepted' ? 'done' : 'todo' },
    { label: 'Invoiced', state: quote.invoiceId ? 'done' : 'todo' },
  ];
}

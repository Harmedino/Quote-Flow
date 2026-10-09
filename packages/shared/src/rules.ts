import type { InvoiceStatus, QuoteStatus } from './constants/statuses';

/**
 * Lifecycle rules shared by the API (which enforces them) and the web app
 * (which uses them to show only the actions that will succeed). Calendar
 * dates are 'YYYY-MM-DD' strings, so they compare correctly as strings.
 */

/** A sent or viewed quote whose expiry date has passed is expired, whatever is stored. */
export function getEffectiveQuoteStatus(
  status: QuoteStatus,
  expiryDate: string,
  today: string,
): QuoteStatus {
  if ((status === 'sent' || status === 'viewed') && expiryDate < today) return 'expired';
  return status;
}

/** A sent or partially paid invoice with a balance after its due date is overdue. */
export function getEffectiveInvoiceStatus(
  status: InvoiceStatus,
  dueDate: string,
  balanceDue: number,
  today: string,
): InvoiceStatus {
  if ((status === 'sent' || status === 'partially_paid') && balanceDue > 0 && dueDate < today) {
    return 'overdue';
  }
  return status;
}

/** Quotes can be edited until the customer has answered (an expired quote can be revised and re-sent). */
export function canEditQuote(status: QuoteStatus): boolean {
  return status === 'draft' || status === 'sent' || status === 'viewed' || status === 'expired';
}

export function canSendQuote(status: QuoteStatus): boolean {
  return status === 'draft' || status === 'sent' || status === 'viewed';
}

export function canDeleteQuote(status: QuoteStatus): boolean {
  return status === 'draft';
}

/** The customer can accept or reject only while the quote is live. */
export function canRespondToQuote(status: QuoteStatus): boolean {
  return status === 'sent' || status === 'viewed';
}

export function canConvertQuote(status: QuoteStatus, invoiceId: string | null): boolean {
  return status === 'accepted' && invoiceId === null;
}

export function canEditInvoice(status: InvoiceStatus): boolean {
  return status === 'draft';
}

export function canDeleteInvoice(status: InvoiceStatus): boolean {
  return status === 'draft';
}

export function canSendInvoice(status: InvoiceStatus): boolean {
  return (
    status === 'draft' || status === 'sent' || status === 'partially_paid' || status === 'overdue'
  );
}

export function canRecordPayment(status: InvoiceStatus, balanceDue: number): boolean {
  return status !== 'cancelled' && status !== 'paid' && status !== 'draft' && balanceDue > 0;
}

/** Invoices with recorded payments cannot be cancelled; delete the payments first. */
export function canCancelInvoice(status: InvoiceStatus, amountPaid: number): boolean {
  return status !== 'cancelled' && status !== 'paid' && amountPaid === 0;
}

import {
  type InvoiceStatus,
  type PublicBusinessDto,
  type PublicInvoiceDto,
  type PublicQuoteDto,
  type QuoteStatus,
  buildWhatsAppUrl,
  toWhatsAppPhone,
} from '@quoteflow/shared';
import type { DocumentStamp } from '@/components/documents/SalesDocument';
import type { HangTagTone } from '@/components/ui/HangTag';
import { daysBetween, dueLabel } from '@/features/dashboard/dashboard-format';
import { stampMoment } from '@/features/documents/document-stamp';
import { formatCalendarDate, formatDate } from '@/lib/format';

/** What customers read about a document's state: plain words, no internal jargon. */

export type BannerTone = 'success' | 'info' | 'warning' | 'danger' | 'neutral';

export interface StatusBannerModel {
  tone: BannerTone;
  title: string;
  message: string;
}

export interface FormatOptions {
  locale?: string;
  /** For answer timestamps; defaults to the viewer's own time zone. */
  timeZone?: string;
}

export interface CustomerStatus {
  label: string;
  tone: HangTagTone;
}

export const CUSTOMER_QUOTE_STATUS: Record<QuoteStatus, CustomerStatus> = {
  draft: { label: 'Draft', tone: 'draft' },
  sent: { label: 'Waiting for you', tone: 'viewed' },
  viewed: { label: 'Waiting for you', tone: 'viewed' },
  accepted: { label: 'Accepted', tone: 'accepted' },
  rejected: { label: 'Declined', tone: 'declined' },
  expired: { label: 'Expired', tone: 'expired' },
};

export const CUSTOMER_INVOICE_STATUS: Record<InvoiceStatus, CustomerStatus> = {
  draft: { label: 'Draft', tone: 'draft' },
  sent: { label: 'Awaiting payment', tone: 'sent' },
  partially_paid: { label: 'Part paid', tone: 'partial' },
  paid: { label: 'Paid', tone: 'paid' },
  overdue: { label: 'Overdue', tone: 'overdue' },
  cancelled: { label: 'Cancelled', tone: 'declined' },
};

type PublicQuote = PublicQuoteDto['quote'];
type PublicInvoice = PublicInvoiceDto['invoice'];

/**
 * The stamp on the customer's ticket once the quote is settled, with the moment of the answer in
 * the viewer's own `timeZone`. While the quote waits for an answer it has none: its tag says so.
 */
export function quoteStamp(
  quote: Pick<PublicQuote, 'status' | 'expiryDate' | 'acceptedAt' | 'rejectedAt'>,
  timeZone: string,
): DocumentStamp | undefined {
  const { label } = CUSTOMER_QUOTE_STATUS[quote.status];
  const at = (iso: string | null) => (iso ? stampMoment(iso, timeZone) : undefined);
  switch (quote.status) {
    case 'accepted':
      return { tone: 'accepted', label, detail: at(quote.acceptedAt) };
    case 'rejected':
      return { tone: 'declined', label, detail: at(quote.rejectedAt) };
    case 'expired':
      return { tone: 'expired', label, detail: formatCalendarDate(quote.expiryDate) };
    default:
      return undefined;
  }
}

/** "Paid", "Overdue · 4 days" or "Cancelled" across the invoice's ticket; `today` is 'YYYY-MM-DD'. */
export function invoiceStamp(
  invoice: Pick<PublicInvoice, 'status' | 'dueDate' | 'paidAt'>,
  today: string,
): DocumentStamp | undefined {
  const { label } = CUSTOMER_INVOICE_STATUS[invoice.status];
  switch (invoice.status) {
    case 'paid':
      // paidAt is the calendar date of the settling payment, like the other document dates.
      return {
        tone: 'paid',
        label,
        detail: invoice.paidAt ? formatCalendarDate(invoice.paidAt.slice(0, 10)) : undefined,
      };
    case 'overdue': {
      const days = -daysBetween(today, invoice.dueDate);
      return {
        tone: 'overdue',
        label,
        detail: days > 0 ? `${days} ${days === 1 ? 'day' : 'days'}` : undefined,
      };
    }
    case 'cancelled':
      return { tone: 'declined', label };
    default:
      return undefined;
  }
}

/** How long a quote waiting for an answer is still valid, e.g. "9 days left"; `today` is 'YYYY-MM-DD'. */
export function validityNote(
  quote: Pick<PublicQuote, 'status' | 'expiryDate'>,
  today: string,
): string | undefined {
  if (quote.status !== 'sent' && quote.status !== 'viewed') return undefined;
  const days = daysBetween(today, quote.expiryDate);
  if (days < 0) return undefined;
  if (days === 0) return 'Last day today';
  return `${days} ${days === 1 ? 'day' : 'days'} left`;
}

/** When an unpaid invoice is due, e.g. "Due in 3 days"; overdue invoices carry a stamp instead. */
export function dueNote(
  invoice: Pick<PublicInvoice, 'status' | 'dueDate'>,
  today: string,
): string | undefined {
  return invoice.status === 'sent' || invoice.status === 'partially_paid'
    ? dueLabel(invoice.dueDate, today)
    : undefined;
}

function answeredOn(timestamp: string | null, options: FormatOptions): string {
  return timestamp
    ? ` on ${formatDate(timestamp, { locale: options.locale, timeZone: options.timeZone })}`
    : '';
}

/** Null while the quote is waiting for an answer: the page then shows the actions instead. */
export function quoteStatusBanner(
  { quote, business }: PublicQuoteDto,
  justAnswered: boolean,
  options: FormatOptions = {},
): StatusBannerModel | null {
  switch (quote.status) {
    case 'accepted':
      return {
        tone: 'success',
        title: justAnswered ? 'Quote accepted. Thank you!' : 'Quote accepted',
        message: `You accepted this quote${answeredOn(quote.acceptedAt, options)}. ${business.name} will be in touch to arrange the next steps.`,
      };
    case 'rejected':
      return {
        tone: 'neutral',
        title: 'Quote declined',
        message: justAnswered
          ? `Thanks for letting ${business.name} know. If anything changes, you can contact them for a new quote.`
          : `You declined this quote${answeredOn(quote.rejectedAt, options)}. Changed your mind? Contact ${business.name} for a new quote.`,
      };
    case 'expired':
      return {
        tone: 'warning',
        title: 'This quote has expired',
        message: `It was valid until ${formatCalendarDate(quote.expiryDate, options)}. Please contact ${business.name} for an updated quote.`,
      };
    default:
      return null;
  }
}

/** Shown when an answer is refused because the business changed the quote after it was opened. */
export const QUOTE_REVISED_BANNER: StatusBannerModel = {
  tone: 'info',
  title: 'This quote was just updated',
  message: 'Please review the changes before answering.',
};

/** Whether the customer still has something to pay: the amount due is then the page's headline. */
export function isAwaitingPayment({
  status,
}: Pick<PublicInvoiceDto['invoice'], 'status'>): boolean {
  return status === 'sent' || status === 'partially_paid' || status === 'overdue';
}

/** Null while payment is simply due: the page's amount-due card shows the amount and due date. */
export function invoiceStatusBanner(
  { invoice, business }: PublicInvoiceDto,
  options: FormatOptions = {},
): StatusBannerModel | null {
  switch (invoice.status) {
    case 'paid':
      return {
        tone: 'success',
        title: 'Paid in full',
        // paidAt is formatted in UTC like the calendar dates, so it never shifts a day.
        message: `Thank you! This invoice was paid${answeredOn(invoice.paidAt, { ...options, timeZone: 'UTC' })}.`,
      };
    case 'overdue':
      return {
        tone: 'danger',
        title: 'Payment overdue',
        // The amount and the date it was due are the headline of the page's amount-due card.
        message: `Please contact ${business.name} to arrange payment.`,
      };
    case 'cancelled':
      return {
        tone: 'neutral',
        title: 'Invoice cancelled',
        message: `${business.name} has cancelled this invoice. No payment is due.`,
      };
    default:
      return null;
  }
}

export interface ContactLink {
  kind: 'phone' | 'whatsapp' | 'email';
  /** A word for the button, e.g. "Call". */
  label: string;
  /** The rest of its accessible name, e.g. the number to call. */
  detail: string;
  href: string;
}

/** Ways to reach the business about a document, most immediate first. */
export function businessContactLinks(
  business: Pick<PublicBusinessDto, 'name' | 'phone' | 'email'>,
  documentLabel: string,
): ContactLink[] {
  const links: ContactLink[] = [];
  if (business.phone) {
    links.push({
      kind: 'phone',
      label: 'Call',
      detail: business.phone,
      href: `tel:${business.phone.replace(/[^\d+]/g, '')}`,
    });
    if (toWhatsAppPhone(business.phone)) {
      links.push({
        kind: 'whatsapp',
        label: 'WhatsApp',
        detail: business.name,
        href: buildWhatsAppUrl(
          `Hi ${business.name}, I have a question about ${documentLabel}.`,
          business.phone,
        ),
      });
    }
  }
  if (business.email) {
    links.push({
      kind: 'email',
      label: 'Email',
      detail: business.email,
      href: `mailto:${business.email}?subject=${encodeURIComponent(documentLabel)}`,
    });
  }
  return links;
}

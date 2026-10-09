import {
  type InvoiceStatus,
  type PublicBusinessDto,
  type PublicInvoiceDto,
  type PublicQuoteDto,
  type QuoteStatus,
  buildWhatsAppUrl,
  toWhatsAppPhone,
} from '@quoteflow/shared';
import type { BadgeTone } from '@/components/ui/Badge';
import { formatCalendarDate, formatDate, formatMoney } from '@/lib/format';

/** What customers read about a document's state: plain words, no internal jargon. */

export type BannerTone = 'success' | 'info' | 'warning' | 'danger' | 'neutral';

export interface StatusBannerModel {
  tone: BannerTone;
  title: string;
  message: string;
  /** Whether to offer ways to reach the business. */
  showContact: boolean;
}

export interface FormatOptions {
  locale?: string;
  /** For answer timestamps; defaults to the viewer's own time zone. */
  timeZone?: string;
}

export const CUSTOMER_QUOTE_STATUS: Record<QuoteStatus, { label: string; tone: BadgeTone }> = {
  draft: { label: 'Draft', tone: 'neutral' },
  sent: { label: 'Awaiting your response', tone: 'info' },
  viewed: { label: 'Awaiting your response', tone: 'info' },
  accepted: { label: 'Accepted', tone: 'success' },
  rejected: { label: 'Declined', tone: 'neutral' },
  expired: { label: 'Expired', tone: 'warning' },
};

export const CUSTOMER_INVOICE_STATUS: Record<InvoiceStatus, { label: string; tone: BadgeTone }> = {
  draft: { label: 'Draft', tone: 'neutral' },
  sent: { label: 'Awaiting payment', tone: 'info' },
  partially_paid: { label: 'Partially paid', tone: 'warning' },
  paid: { label: 'Paid', tone: 'success' },
  overdue: { label: 'Overdue', tone: 'danger' },
  cancelled: { label: 'Cancelled', tone: 'neutral' },
};

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
        showContact: true,
      };
    case 'rejected':
      return {
        tone: 'neutral',
        title: 'Quote declined',
        message: justAnswered
          ? `Thanks for letting ${business.name} know. If anything changes, you can contact them for a new quote.`
          : `You declined this quote${answeredOn(quote.rejectedAt, options)}. Changed your mind? Contact ${business.name} for a new quote.`,
        showContact: true,
      };
    case 'expired':
      return {
        tone: 'warning',
        title: 'This quote has expired',
        message: `It was valid until ${formatCalendarDate(quote.expiryDate, options)}. Please contact ${business.name} for an updated quote.`,
        showContact: true,
      };
    default:
      return null;
  }
}

/** Null while payment is simply due: the page's summary shows the amount and due date. */
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
        showContact: false,
      };
    case 'overdue':
      return {
        tone: 'danger',
        title: 'Payment overdue',
        message: `This invoice was due on ${formatCalendarDate(invoice.dueDate, options)}. ${formatMoney(invoice.balanceDue, invoice.currency, options.locale)} is outstanding. Please contact ${business.name} to arrange payment.`,
        showContact: true,
      };
    case 'cancelled':
      return {
        tone: 'neutral',
        title: 'Invoice cancelled',
        message: `${business.name} has cancelled this invoice. No payment is due.`,
        showContact: true,
      };
    default:
      return null;
  }
}

export interface ContactLink {
  kind: 'phone' | 'whatsapp' | 'email';
  label: string;
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
      label: `Call ${business.phone}`,
      href: `tel:${business.phone.replace(/[^\d+]/g, '')}`,
    });
    if (toWhatsAppPhone(business.phone)) {
      links.push({
        kind: 'whatsapp',
        label: 'WhatsApp',
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
      href: `mailto:${business.email}?subject=${encodeURIComponent(documentLabel)}`,
    });
  }
  return links;
}

import {
  type CurrencyCode,
  type CustomerSnapshotDto,
  type DiscountDto,
  INVOICE_STATUS_LABELS,
  type LineItemDto,
  type PublicBusinessDto,
  QUOTE_STATUS_LABELS,
  type TotalsDto,
  getEffectiveQuoteStatus,
} from '@quoteflow/shared';
import type { Business } from '../../models';
import { type InvoiceRecord, effectiveInvoiceStatus } from '../../serializers/invoice.serializer';
import type { QuoteRecord } from '../../serializers/quote.serializer';
import {
  toCustomerSnapshotDto,
  toDiscountDto,
  toIsoDate,
  toLineItemDto,
  toPublicBusinessDto,
} from '../../serializers/sales-document.serializer';

export type PdfTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger';

/** Everything a quote or invoice PDF shows, built from the same data as the DTOs. */
export interface PdfDocumentModel {
  title: 'Quotation' | 'Invoice';
  number: string;
  /** The effective status, or null when it is not worth printing (e.g. a sent quote). */
  status: { label: string; tone: PdfTone } | null;
  currency: CurrencyCode;
  business: PublicBusinessDto;
  customer: CustomerSnapshotDto;
  issueDate: string;
  /** "Valid until" for quotes, "Due date" for invoices. */
  deadline: { label: string; date: string };
  items: LineItemDto[];
  discount: DiscountDto;
  taxRate: number;
  totals: TotalsDto;
  /** Invoices only. */
  payment: { amountPaid: number; balanceDue: number } | null;
  notes: string | null;
  terms: string | null;
}

const QUOTE_TONES: Partial<Record<keyof typeof QUOTE_STATUS_LABELS, PdfTone>> = {
  accepted: 'success',
  rejected: 'danger',
  expired: 'warning',
};

const INVOICE_TONES: Partial<Record<keyof typeof INVOICE_STATUS_LABELS, PdfTone>> = {
  sent: 'info',
  partially_paid: 'warning',
  paid: 'success',
  overdue: 'danger',
  cancelled: 'neutral',
};

type SalesRecord = QuoteRecord | InvoiceRecord;

function sharedFields(document: SalesRecord, business: Business) {
  return {
    currency: document.currency,
    business: toPublicBusinessDto(business),
    customer: toCustomerSnapshotDto(document.customer),
    issueDate: toIsoDate(document.issueDate),
    items: document.items.map(toLineItemDto),
    discount: toDiscountDto(document.discount),
    taxRate: document.taxRate,
    totals: {
      subtotal: document.totals.subtotal,
      discount: document.totals.discount,
      tax: document.totals.tax,
      total: document.totals.total,
    },
    notes: document.notes ?? null,
    terms: document.terms ?? null,
  };
}

/** `today` is the business's current date ('YYYY-MM-DD'), for the effective status. */
export function quotePdfModel(
  quote: QuoteRecord,
  business: Business,
  today: string,
): PdfDocumentModel {
  const expiryDate = toIsoDate(quote.expiryDate);
  const status = getEffectiveQuoteStatus(quote.status, expiryDate, today);
  const tone = QUOTE_TONES[status];
  return {
    ...sharedFields(quote, business),
    title: 'Quotation',
    number: quote.quoteNumber,
    status: tone ? { label: QUOTE_STATUS_LABELS[status], tone } : null,
    deadline: { label: 'Valid until', date: expiryDate },
    payment: null,
  };
}

export function invoicePdfModel(
  invoice: InvoiceRecord,
  business: Business,
  today: string,
): PdfDocumentModel {
  const status = effectiveInvoiceStatus(invoice, today);
  const tone = INVOICE_TONES[status];
  return {
    ...sharedFields(invoice, business),
    title: 'Invoice',
    number: invoice.invoiceNumber,
    status: tone ? { label: INVOICE_STATUS_LABELS[status], tone } : null,
    deadline: { label: 'Due date', date: toIsoDate(invoice.dueDate) },
    payment: { amountPaid: invoice.amountPaid, balanceDue: invoice.balanceDue },
  };
}

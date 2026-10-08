import {
  type LineItemDto,
  type PublicInvoiceDto,
  type PublicQuoteDto,
  type TotalsDto,
  getEffectiveInvoiceStatus,
  getEffectiveQuoteStatus,
} from '@quoteflow/shared';
import type { Business, Invoice, LineItem, Quote } from '../models';
import {
  toCustomerSnapshotDto,
  toDiscountDto,
  toIsoDate,
  toLineItemDto,
  toPublicBusinessDto,
  toTimestamp,
} from './sales-document.serializer';

/**
 * What a customer without an account sees through a public link. Built field
 * by field so internal data (ids, the token, view tracking, the author, sent
 * and conversion details) can never leak through a spread.
 */

/** The catalog service id is internal to the business, so public items never carry it. */
function toPublicLineItemDto(item: LineItem): LineItemDto {
  return { ...toLineItemDto(item), serviceId: null };
}

function toTotalsDto(totals: TotalsDto): TotalsDto {
  return {
    subtotal: totals.subtotal,
    discount: totals.discount,
    tax: totals.tax,
    total: totals.total,
  };
}

/** `today` is the current date in the business's time zone ('YYYY-MM-DD'). */
export function toPublicQuoteDto(quote: Quote, business: Business, today: string): PublicQuoteDto {
  const expiryDate = toIsoDate(quote.expiryDate);
  return {
    business: toPublicBusinessDto(business),
    quote: {
      quoteNumber: quote.quoteNumber,
      status: getEffectiveQuoteStatus(quote.status, expiryDate, today),
      currency: quote.currency,
      customer: toCustomerSnapshotDto(quote.customer),
      items: quote.items.map(toPublicLineItemDto),
      discount: toDiscountDto(quote.discount),
      taxRate: quote.taxRate,
      totals: toTotalsDto(quote.totals),
      notes: quote.notes ?? null,
      terms: quote.terms ?? null,
      issueDate: toIsoDate(quote.issueDate),
      expiryDate,
      acceptedAt: toTimestamp(quote.acceptedAt),
      rejectedAt: toTimestamp(quote.rejectedAt),
      rejectionReason: quote.rejectionReason ?? null,
    },
  };
}

export function toPublicInvoiceDto(
  invoice: Invoice,
  business: Business,
  today: string,
): PublicInvoiceDto {
  const dueDate = toIsoDate(invoice.dueDate);
  return {
    business: toPublicBusinessDto(business),
    invoice: {
      invoiceNumber: invoice.invoiceNumber,
      status: getEffectiveInvoiceStatus(invoice.status, dueDate, invoice.balanceDue, today),
      currency: invoice.currency,
      customer: toCustomerSnapshotDto(invoice.customer),
      items: invoice.items.map(toPublicLineItemDto),
      discount: toDiscountDto(invoice.discount),
      taxRate: invoice.taxRate,
      totals: toTotalsDto(invoice.totals),
      amountPaid: invoice.amountPaid,
      balanceDue: invoice.balanceDue,
      notes: invoice.notes ?? null,
      terms: invoice.terms ?? null,
      issueDate: toIsoDate(invoice.issueDate),
      dueDate,
      paidAt: toTimestamp(invoice.paidAt),
    },
  };
}

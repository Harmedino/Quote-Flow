import { type QuoteDto, type QuoteListItemDto, getEffectiveQuoteStatus } from '@quoteflow/shared';
import type { Types } from 'mongoose';
import type { Quote } from '../models';
import {
  toCustomerSnapshotDto,
  toDiscountDto,
  toIsoDate,
  toLineItemDto,
  toTimestamp,
} from './sales-document.serializer';

export type QuoteRecord = Quote & { _id: Types.ObjectId };

/**
 * `today` is the current date in the business's time zone ('YYYY-MM-DD'); it
 * turns a sent or viewed quote past its expiry date into 'expired'.
 */
export function toQuoteDto(quote: QuoteRecord, today: string): QuoteDto {
  const expiryDate = toIsoDate(quote.expiryDate);
  return {
    id: quote._id.toString(),
    quoteNumber: quote.quoteNumber,
    status: getEffectiveQuoteStatus(quote.status, expiryDate, today),
    currency: quote.currency,
    customerId: quote.customerId.toString(),
    customer: toCustomerSnapshotDto(quote.customer),
    items: quote.items.map(toLineItemDto),
    discount: toDiscountDto(quote.discount),
    taxRate: quote.taxRate,
    totals: {
      subtotal: quote.totals.subtotal,
      discount: quote.totals.discount,
      tax: quote.totals.tax,
      total: quote.totals.total,
    },
    notes: quote.notes ?? null,
    terms: quote.terms ?? null,
    issueDate: toIsoDate(quote.issueDate),
    expiryDate,
    publicToken: quote.publicToken,
    sentAt: toTimestamp(quote.sentAt),
    viewedAt: toTimestamp(quote.viewedAt),
    acceptedAt: toTimestamp(quote.acceptedAt),
    rejectedAt: toTimestamp(quote.rejectedAt),
    rejectionReason: quote.rejectionReason ?? null,
    invoiceId: quote.invoiceId ? quote.invoiceId.toString() : null,
    convertedAt: toTimestamp(quote.convertedAt),
    createdAt: quote.createdAt.toISOString(),
    updatedAt: quote.updatedAt.toISOString(),
  };
}

/** Works with hydrated documents and with lean records that include the fields below. */
export type QuoteListRecord = Pick<
  QuoteRecord,
  | '_id'
  | 'quoteNumber'
  | 'status'
  | 'currency'
  | 'customerId'
  | 'customer'
  | 'totals'
  | 'issueDate'
  | 'expiryDate'
  | 'invoiceId'
  | 'createdAt'
>;

/** The projection that loads exactly what {@link toQuoteListItemDto} needs. */
export const QUOTE_LIST_PROJECTION =
  'quoteNumber status currency customerId customer.name totals.total issueDate expiryDate invoiceId createdAt';

export function toQuoteListItemDto(quote: QuoteListRecord, today: string): QuoteListItemDto {
  const expiryDate = toIsoDate(quote.expiryDate);
  return {
    id: quote._id.toString(),
    quoteNumber: quote.quoteNumber,
    status: getEffectiveQuoteStatus(quote.status, expiryDate, today),
    currency: quote.currency,
    customerId: quote.customerId.toString(),
    customerName: quote.customer.name,
    total: quote.totals.total,
    issueDate: toIsoDate(quote.issueDate),
    expiryDate,
    invoiceId: quote.invoiceId ? quote.invoiceId.toString() : null,
    createdAt: quote.createdAt.toISOString(),
  };
}

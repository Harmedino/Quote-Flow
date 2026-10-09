import { z } from 'zod';
import type { CurrencyCode } from './constants/currencies';
import { TEXT_LIMITS } from './constants/limits';
import { QUOTE_STATUSES, type QuoteStatus } from './constants/statuses';
import { isoDateSchema } from './dates';
import type {
  CustomerSnapshotDto,
  DiscountDto,
  LineItemDto,
  PublicBusinessDto,
  TotalsDto,
} from './sales-documents';
import {
  discountSchema,
  lineItemsSchema,
  objectIdSchema,
  paginationQuerySchema,
  percentageSchema,
} from './validation';

/**
 * Business-side (bearer):
 *   GET    /api/quotes                 QuoteListQuery → 200 paginated QuoteListItemDto[]
 *   POST   /api/quotes                 QuoteInput     → 201 QuoteDto (a new draft)
 *   GET    /api/quotes/:id                            → 200 QuoteDto
 *   PUT    /api/quotes/:id             QuoteInput     → 200 QuoteDto (while canEditQuote)
 *   DELETE /api/quotes/:id                            → 204 (drafts only)
 *   POST   /api/quotes/:id/send                       → 200 QuoteDto (marks it sent; sharing happens via link/WhatsApp)
 *   POST   /api/quotes/:id/duplicate                  → 201 QuoteDto (a new draft copy)
 *   POST   /api/quotes/:id/convert                    → 201 InvoiceDto (accepted quotes only, once)
 *   GET    /api/quotes/:id/pdf                        → application/pdf
 *
 * Public (no account; the 256-bit token is the capability):
 *   GET    /api/public/quotes/:token                  → 200 PublicQuoteDto (records the view,
 *                                                       except for the business's own ?preview=1)
 *   POST   /api/public/quotes/:token/accept  AcceptQuoteInput → 200 PublicQuoteDto
 *   POST   /api/public/quotes/:token/reject  RejectQuoteInput → 200 PublicQuoteDto
 *          (409 when `revision` is not the quote's current one: the customer must see a
 *          revised quote before answering it)
 *   GET    /api/public/quotes/:token/pdf              → application/pdf
 *
 * Omitted taxRate, notes, terms and dates fall back to the business defaults
 * (default tax rate, default quote notes/terms, today in the business time
 * zone, today + quote validity days).
 */

const optionalText = (max: number) =>
  z.string().trim().max(max, `Must be at most ${max} characters`).optional();

export const quoteInputSchema = z
  .object({
    customerId: objectIdSchema,
    items: lineItemsSchema,
    discount: discountSchema.nullable().optional(),
    taxRate: percentageSchema.optional(),
    notes: optionalText(TEXT_LIMITS.notes),
    terms: optionalText(TEXT_LIMITS.terms),
    issueDate: isoDateSchema.optional(),
    expiryDate: isoDateSchema.optional(),
  })
  .refine((input) => !input.issueDate || !input.expiryDate || input.expiryDate >= input.issueDate, {
    path: ['expiryDate'],
    message: 'The expiry date cannot be before the issue date',
  });

export const quoteListQuerySchema = paginationQuerySchema.extend({
  status: z.enum(QUOTE_STATUSES).optional(),
  customerId: objectIdSchema.optional(),
  search: z.string().trim().max(100).optional(),
});

/** An answer names the revision of the quote the customer saw (PublicQuoteDto's `revision`). */
export const acceptQuoteInputSchema = z.object({
  revision: z.number().int().min(0),
});

export const rejectQuoteInputSchema = acceptQuoteInputSchema.extend({
  reason: optionalText(TEXT_LIMITS.rejectionReason),
});

export type QuoteInput = z.input<typeof quoteInputSchema>;
export type QuoteListQuery = z.input<typeof quoteListQuerySchema>;
export type AcceptQuoteInput = z.input<typeof acceptQuoteInputSchema>;
export type RejectQuoteInput = z.input<typeof rejectQuoteInputSchema>;

export interface QuoteDto {
  id: string;
  quoteNumber: string;
  /** Effective status: a sent or viewed quote past its expiry date is reported as 'expired'. */
  status: QuoteStatus;
  currency: CurrencyCode;
  customerId: string;
  customer: CustomerSnapshotDto;
  items: LineItemDto[];
  discount: DiscountDto;
  taxRate: number;
  totals: TotalsDto;
  notes: string | null;
  terms: string | null;
  issueDate: string;
  expiryDate: string;
  publicToken: string;
  sentAt: string | null;
  viewedAt: string | null;
  acceptedAt: string | null;
  rejectedAt: string | null;
  rejectionReason: string | null;
  invoiceId: string | null;
  convertedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface QuoteListItemDto {
  id: string;
  quoteNumber: string;
  status: QuoteStatus;
  currency: CurrencyCode;
  customerId: string;
  customerName: string;
  total: number;
  issueDate: string;
  expiryDate: string;
  invoiceId: string | null;
  createdAt: string;
}

export interface PublicQuoteDto {
  business: PublicBusinessDto;
  quote: {
    quoteNumber: string;
    status: QuoteStatus;
    currency: CurrencyCode;
    customer: CustomerSnapshotDto;
    items: LineItemDto[];
    discount: DiscountDto;
    taxRate: number;
    totals: TotalsDto;
    notes: string | null;
    terms: string | null;
    issueDate: string;
    expiryDate: string;
    acceptedAt: string | null;
    rejectedAt: string | null;
    rejectionReason: string | null;
    /** Changes whenever the business edits the quote; answers must send the one they saw. */
    revision: number;
  };
}

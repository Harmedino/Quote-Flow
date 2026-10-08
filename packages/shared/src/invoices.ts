import { z } from 'zod';
import type { CurrencyCode } from './constants/currencies';
import { TEXT_LIMITS } from './constants/limits';
import { PAYMENT_METHODS, type PaymentMethod } from './constants/payments';
import { INVOICE_STATUSES, type InvoiceStatus } from './constants/statuses';
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
  moneySchema,
  objectIdSchema,
  paginationQuerySchema,
  percentageSchema,
} from './validation';

/**
 * Business-side (bearer):
 *   GET    /api/invoices                     InvoiceListQuery → 200 paginated InvoiceListItemDto[]
 *   POST   /api/invoices                     InvoiceInput     → 201 InvoiceDto (standalone draft)
 *   GET    /api/invoices/:id                                  → 200 InvoiceDto
 *   PUT    /api/invoices/:id                 InvoiceInput     → 200 InvoiceDto (drafts only)
 *   DELETE /api/invoices/:id                                  → 204 (drafts only)
 *   POST   /api/invoices/:id/send                             → 200 InvoiceDto (marks it sent)
 *   POST   /api/invoices/:id/payments        RecordPaymentInput → 201 InvoiceDto
 *   DELETE /api/invoices/:id/payments/:paymentId              → 200 InvoiceDto
 *   POST   /api/invoices/:id/cancel                           → 200 InvoiceDto
 *   GET    /api/invoices/:id/pdf                              → application/pdf
 *   POST   /api/quotes/:id/convert                            → 201 InvoiceDto
 *
 * Public (no account):
 *   GET    /api/public/invoices/:token                        → 200 PublicInvoiceDto
 *   GET    /api/public/invoices/:token/pdf                    → application/pdf
 *
 * Omitted taxRate, notes, terms and dates fall back to the business defaults
 * (today in the business time zone; due = issue + invoice due days).
 */

const optionalText = (max: number) =>
  z.string().trim().max(max, `Must be at most ${max} characters`).optional();

export const invoiceInputSchema = z
  .object({
    customerId: objectIdSchema,
    items: lineItemsSchema,
    discount: discountSchema.nullable().optional(),
    taxRate: percentageSchema.optional(),
    notes: optionalText(TEXT_LIMITS.notes),
    terms: optionalText(TEXT_LIMITS.terms),
    issueDate: isoDateSchema.optional(),
    dueDate: isoDateSchema.optional(),
  })
  .refine((input) => !input.issueDate || !input.dueDate || input.dueDate >= input.issueDate, {
    path: ['dueDate'],
    message: 'The due date cannot be before the issue date',
  });

export const invoiceListQuerySchema = paginationQuerySchema.extend({
  status: z.enum(INVOICE_STATUSES).optional(),
  customerId: objectIdSchema.optional(),
  search: z.string().trim().max(100).optional(),
});

export const recordPaymentInputSchema = z.object({
  amount: moneySchema.refine((amount) => amount > 0, 'Enter an amount greater than zero'),
  method: z.enum(PAYMENT_METHODS),
  /** Defaults to today in the business time zone. */
  paidAt: isoDateSchema.optional(),
  reference: optionalText(TEXT_LIMITS.paymentReference),
  note: optionalText(TEXT_LIMITS.paymentNote),
});

export type InvoiceInput = z.input<typeof invoiceInputSchema>;
export type InvoiceListQuery = z.input<typeof invoiceListQuerySchema>;
export type RecordPaymentInput = z.input<typeof recordPaymentInputSchema>;

export interface PaymentDto {
  id: string;
  amount: number;
  method: PaymentMethod;
  paidAt: string;
  reference: string | null;
  note: string | null;
  createdAt: string;
}

export interface InvoiceDto {
  id: string;
  invoiceNumber: string;
  /** Effective status: a sent or partially paid invoice past its due date with a balance is 'overdue'. */
  status: InvoiceStatus;
  currency: CurrencyCode;
  customerId: string;
  customer: CustomerSnapshotDto;
  quoteId: string | null;
  items: LineItemDto[];
  discount: DiscountDto;
  taxRate: number;
  totals: TotalsDto;
  amountPaid: number;
  balanceDue: number;
  payments: PaymentDto[];
  notes: string | null;
  terms: string | null;
  issueDate: string;
  dueDate: string;
  publicToken: string;
  sentAt: string | null;
  paidAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceListItemDto {
  id: string;
  invoiceNumber: string;
  status: InvoiceStatus;
  currency: CurrencyCode;
  customerId: string;
  customerName: string;
  total: number;
  balanceDue: number;
  issueDate: string;
  dueDate: string;
  createdAt: string;
}

export interface PublicInvoiceDto {
  business: PublicBusinessDto;
  invoice: {
    invoiceNumber: string;
    status: InvoiceStatus;
    currency: CurrencyCode;
    customer: CustomerSnapshotDto;
    items: LineItemDto[];
    discount: DiscountDto;
    taxRate: number;
    totals: TotalsDto;
    amountPaid: number;
    balanceDue: number;
    notes: string | null;
    terms: string | null;
    issueDate: string;
    dueDate: string;
    paidAt: string | null;
  };
}

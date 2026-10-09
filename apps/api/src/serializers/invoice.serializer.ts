import {
  type InvoiceDto,
  type InvoiceListItemDto,
  type InvoiceStatus,
  type PaymentDto,
  getEffectiveInvoiceStatus,
} from '@quoteflow/shared';
import type { Types } from 'mongoose';
import type { Invoice, Payment } from '../models';
import {
  toCustomerSnapshotDto,
  toDiscountDto,
  toIsoDate,
  toLineItemDto,
  toTimestamp,
} from './sales-document.serializer';

/** A hydrated invoice or a lean one: both carry `_id` and the stored fields. */
export type InvoiceRecord = Invoice & { _id: Types.ObjectId };

/** The status to report: a sent or partially paid invoice past due with a balance is overdue. */
export function effectiveInvoiceStatus(
  invoice: Pick<Invoice, 'status' | 'dueDate' | 'balanceDue'>,
  today: string,
): InvoiceStatus {
  return getEffectiveInvoiceStatus(
    invoice.status,
    toIsoDate(invoice.dueDate),
    invoice.balanceDue,
    today,
  );
}

export function toPaymentDto(payment: Payment): PaymentDto {
  return {
    id: payment._id.toString(),
    amount: payment.amount,
    method: payment.method,
    paidAt: toIsoDate(payment.paidAt),
    reference: payment.reference ?? null,
    note: payment.note ?? null,
    createdAt: payment.createdAt.toISOString(),
  };
}

/** `today` is the business's current calendar date ('YYYY-MM-DD'), for the effective status. */
export function toInvoiceDto(invoice: InvoiceRecord, today: string): InvoiceDto {
  return {
    id: invoice._id.toString(),
    invoiceNumber: invoice.invoiceNumber,
    status: effectiveInvoiceStatus(invoice, today),
    currency: invoice.currency,
    customerId: invoice.customerId.toString(),
    customer: toCustomerSnapshotDto(invoice.customer),
    quoteId: invoice.quoteId ? invoice.quoteId.toString() : null,
    items: invoice.items.map(toLineItemDto),
    discount: toDiscountDto(invoice.discount),
    taxRate: invoice.taxRate,
    totals: {
      subtotal: invoice.totals.subtotal,
      discount: invoice.totals.discount,
      tax: invoice.totals.tax,
      total: invoice.totals.total,
    },
    amountPaid: invoice.amountPaid,
    balanceDue: invoice.balanceDue,
    payments: invoice.payments.map(toPaymentDto),
    notes: invoice.notes ?? null,
    terms: invoice.terms ?? null,
    issueDate: toIsoDate(invoice.issueDate),
    dueDate: toIsoDate(invoice.dueDate),
    publicToken: invoice.publicToken,
    sentAt: toTimestamp(invoice.sentAt),
    paidAt: toTimestamp(invoice.paidAt),
    cancelledAt: toTimestamp(invoice.cancelledAt),
    createdAt: invoice.createdAt.toISOString(),
    updatedAt: invoice.updatedAt.toISOString(),
  };
}

export type InvoiceListRecord = Pick<
  InvoiceRecord,
  | '_id'
  | 'invoiceNumber'
  | 'status'
  | 'currency'
  | 'customerId'
  | 'customer'
  | 'totals'
  | 'balanceDue'
  | 'issueDate'
  | 'dueDate'
  | 'createdAt'
>;

/** Projection that loads exactly what {@link toInvoiceListItemDto} needs. */
export const INVOICE_LIST_PROJECTION = {
  invoiceNumber: 1,
  status: 1,
  currency: 1,
  customerId: 1,
  'customer.name': 1,
  totals: 1,
  balanceDue: 1,
  issueDate: 1,
  dueDate: 1,
  createdAt: 1,
} as const;

export function toInvoiceListItemDto(
  invoice: InvoiceListRecord,
  today: string,
): InvoiceListItemDto {
  return {
    id: invoice._id.toString(),
    invoiceNumber: invoice.invoiceNumber,
    status: effectiveInvoiceStatus(invoice, today),
    currency: invoice.currency,
    customerId: invoice.customerId.toString(),
    customerName: invoice.customer.name,
    total: invoice.totals.total,
    balanceDue: invoice.balanceDue,
    issueDate: toIsoDate(invoice.issueDate),
    dueDate: toIsoDate(invoice.dueDate),
    createdAt: invoice.createdAt.toISOString(),
  };
}

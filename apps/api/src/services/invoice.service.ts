import {
  type InvoiceDto,
  type InvoiceListItemDto,
  type InvoiceStatus,
  type PaginationMeta,
  addDaysToIsoDate,
  canCancelInvoice,
  canDeleteInvoice,
  canEditInvoice,
  canRecordPayment,
  canSendInvoice,
  type invoiceInputSchema,
  type invoiceListQuerySchema,
  isoDateToUtcDate,
  type recordPaymentInputSchema,
  todayInTimeZone,
} from '@quoteflow/shared';
import type { QueryFilter, Types } from 'mongoose';
import type { z } from 'zod';
import {
  type BusinessDocument,
  type Invoice,
  type InvoiceDocument,
  InvoiceModel,
  toCustomerSnapshot,
} from '../models';
import {
  INVOICE_LIST_PROJECTION,
  type InvoiceListRecord,
  effectiveInvoiceStatus,
  toInvoiceDto,
  toInvoiceListItemDto,
} from '../serializers/invoice.serializer';
import { toIsoDate } from '../serializers/sales-document.serializer';
import { conflict, notFound, validationFailed } from '../utils/app-error';
import { skipFor, toPaginationMeta } from '../utils/pagination';
import { containsPattern } from '../utils/search-pattern';
import { generatePublicToken } from '../utils/tokens';
import type { AuthContext } from './access-token.service';
import {
  assertServicesBelong,
  blankToUndefined,
  findBillableCustomer,
  findOwnBusiness,
  textOrFallback,
  toLineItemContent,
} from './invoice-content';
import { nextDocumentNumber } from './numbering.service';

export type InvoiceInputData = z.output<typeof invoiceInputSchema>;
export type InvoiceListData = z.output<typeof invoiceListQuerySchema>;
export type RecordPaymentData = z.output<typeof recordPaymentInputSchema>;

const INVOICE_NOT_FOUND = 'Invoice not found.';

/** The caller's business and its current calendar date, which decides what is overdue. */
interface Tenant {
  business: BusinessDocument;
  businessId: Types.ObjectId;
  today: string;
}

async function loadTenant(auth: AuthContext): Promise<Tenant> {
  const business = await findOwnBusiness(auth);
  return { business, businessId: business._id, today: todayInTimeZone(business.timezone) };
}

async function findOwnInvoice({ businessId }: Tenant, id: string): Promise<InvoiceDocument> {
  const invoice = await InvoiceModel.findOne({ _id: id, businessId });
  if (!invoice) throw notFound(INVOICE_NOT_FOUND);
  return invoice;
}

/** Loads an invoice with its effective status, for checking the lifecycle rules. */
async function loadInvoice(auth: AuthContext, id: string) {
  const tenant = await loadTenant(auth);
  const invoice = await findOwnInvoice(tenant, id);
  return { tenant, invoice, status: effectiveInvoiceStatus(invoice, tenant.today) };
}

/** Sent or partially paid, with a balance, past due: what getEffectiveInvoiceStatus calls overdue. */
function pastDueCondition(today: string): QueryFilter<Invoice> {
  return { balanceDue: { $gt: 0 }, dueDate: { $lt: isoDateToUtcDate(today) } };
}

function statusConditions(status: InvoiceStatus, today: string): QueryFilter<Invoice>[] {
  const pastDue = pastDueCondition(today);
  switch (status) {
    case 'overdue':
      return [
        {
          $or: [{ status: 'overdue' }, { status: { $in: ['sent', 'partially_paid'] }, ...pastDue }],
        },
      ];
    case 'sent':
    case 'partially_paid':
      return [
        { status },
        {
          $or: [{ balanceDue: { $lte: 0 } }, { dueDate: { $gte: isoDateToUtcDate(today) } }],
        },
      ];
    default:
      return [{ status }];
  }
}

/** Newest first. Status filters use the effective status, so 'overdue' includes past-due sent invoices. */
export async function listInvoices(
  auth: AuthContext,
  query: InvoiceListData,
): Promise<{ data: InvoiceListItemDto[]; meta: PaginationMeta }> {
  const { businessId, today } = await loadTenant(auth);
  const conditions: QueryFilter<Invoice>[] = [];
  if (query.status) conditions.push(...statusConditions(query.status, today));
  if (query.search) {
    const pattern = containsPattern(query.search);
    conditions.push({ $or: [{ invoiceNumber: pattern }, { 'customer.name': pattern }] });
  }
  const filter: QueryFilter<Invoice> = {
    businessId,
    ...(query.customerId && { customerId: query.customerId }),
    ...(conditions.length > 0 && { $and: conditions }),
  };

  const [invoices, total] = await Promise.all([
    InvoiceModel.find(filter, INVOICE_LIST_PROJECTION)
      .sort({ createdAt: -1, _id: -1 })
      .skip(skipFor(query))
      .limit(query.pageSize)
      .lean<InvoiceListRecord[]>(),
    InvoiceModel.countDocuments(filter),
  ]);
  return {
    data: invoices.map((invoice) => toInvoiceListItemDto(invoice, today)),
    meta: toPaginationMeta(query, total),
  };
}

export async function getInvoice(auth: AuthContext, id: string): Promise<InvoiceDto> {
  const { tenant, invoice } = await loadInvoice(auth, id);
  return toInvoiceDto(invoice, tenant.today);
}

/** Dates default to today (business time zone) and today + the business's due days. */
function resolveDates(
  input: Pick<InvoiceInputData, 'issueDate' | 'dueDate'>,
  defaults: { issueDate: string; dueDays: number },
) {
  const issueDate = input.issueDate ?? defaults.issueDate;
  const dueDate = input.dueDate ?? addDaysToIsoDate(issueDate, defaults.dueDays);
  if (dueDate < issueDate) {
    throw validationFailed([
      { path: 'dueDate', message: 'The due date cannot be before the issue date' },
    ]);
  }
  return { issueDate: isoDateToUtcDate(issueDate), dueDate: isoDateToUtcDate(dueDate) };
}

/** A standalone draft. Omitted tax rate, notes, terms and dates take the business defaults. */
export async function createInvoice(
  auth: AuthContext,
  input: InvoiceInputData,
): Promise<InvoiceDto> {
  const { business, businessId, today } = await loadTenant(auth);
  const customer = await findBillableCustomer(businessId, input.customerId);
  await assertServicesBelong(businessId, input.items);
  const dates = resolveDates(input, { issueDate: today, dueDays: business.invoiceDueDays });

  const invoice = new InvoiceModel({
    businessId,
    invoiceNumber: await nextDocumentNumber(businessId, 'invoice', business.invoicePrefix),
    status: 'draft',
    customerId: customer._id,
    customer: toCustomerSnapshot(customer),
    currency: business.currency,
    items: toLineItemContent(input.items),
    discount: input.discount ?? null,
    taxRate: input.taxRate ?? business.defaultTaxRate,
    notes: textOrFallback(input.notes, business.defaultInvoiceNotes),
    terms: textOrFallback(input.terms, business.defaultInvoiceTerms),
    ...dates,
    publicToken: generatePublicToken(),
    createdBy: auth.userId,
  });
  await invoice.save();
  return toInvoiceDto(invoice, today);
}

/**
 * Replaces a draft's content. Omitted tax rate, notes, terms and dates keep
 * their current values; '' clears notes or terms. The customer snapshot is
 * refreshed, since nothing has been sent yet.
 */
export async function updateInvoice(
  auth: AuthContext,
  id: string,
  input: InvoiceInputData,
): Promise<InvoiceDto> {
  const { tenant, invoice, status } = await loadInvoice(auth, id);
  if (!canEditInvoice(status)) throw conflict('Only draft invoices can be edited.');

  const customer = await findBillableCustomer(
    tenant.businessId,
    input.customerId,
    invoice.customerId,
  );
  await assertServicesBelong(tenant.businessId, input.items);
  const dates = resolveDates(
    {
      issueDate: input.issueDate ?? toIsoDate(invoice.issueDate),
      dueDate: input.dueDate ?? toIsoDate(invoice.dueDate),
    },
    { issueDate: tenant.today, dueDays: tenant.business.invoiceDueDays },
  );

  invoice.set({
    customerId: customer._id,
    customer: toCustomerSnapshot(customer),
    items: toLineItemContent(input.items),
    discount: input.discount ?? null,
    taxRate: input.taxRate ?? invoice.taxRate,
    notes: input.notes === undefined ? invoice.notes : blankToUndefined(input.notes),
    terms: input.terms === undefined ? invoice.terms : blankToUndefined(input.terms),
    ...dates,
  });
  await invoice.save();
  return toInvoiceDto(invoice, tenant.today);
}

export async function deleteInvoice(auth: AuthContext, id: string): Promise<void> {
  const { tenant, invoice, status } = await loadInvoice(auth, id);
  if (!canDeleteInvoice(status)) {
    throw conflict('Only draft invoices can be deleted. Cancel the invoice instead.');
  }
  await InvoiceModel.deleteOne({ _id: invoice._id, businessId: tenant.businessId });
}

/** Marks a draft as sent. Re-sending an invoice that is already out is a no-op. */
export async function sendInvoice(auth: AuthContext, id: string): Promise<InvoiceDto> {
  const { tenant, invoice, status } = await loadInvoice(auth, id);
  if (!canSendInvoice(status)) {
    throw conflict(
      status === 'paid' ? 'This invoice is already paid.' : 'Cancelled invoices cannot be sent.',
    );
  }
  if (invoice.status === 'draft') {
    invoice.status = 'sent';
    invoice.sentAt = new Date();
    await invoice.save();
  }
  return toInvoiceDto(invoice, tenant.today);
}

function paymentRuleViolation(status: InvoiceStatus): string {
  if (status === 'draft') return 'Mark the invoice as sent before recording a payment.';
  if (status === 'cancelled') return 'Payments cannot be recorded on a cancelled invoice.';
  return 'This invoice is already paid in full.';
}

/** The status that matches the invoice's payments; drafts and cancelled invoices never have any. */
function statusAfterPayments(invoice: InvoiceDocument): Pick<Invoice, 'status' | 'paidAt'> {
  const amountPaid = invoice.payments.reduce((sum, payment) => sum + payment.amount, 0);
  if (amountPaid === 0) return { status: 'sent', paidAt: undefined };
  if (amountPaid >= invoice.totals.total) {
    const lastPaidAt = invoice.payments
      .map((payment) => payment.paidAt)
      .reduce((latest, paidAt) => (paidAt > latest ? paidAt : latest));
    return { status: 'paid', paidAt: lastPaidAt };
  }
  return { status: 'partially_paid', paidAt: undefined };
}

export async function recordPayment(
  auth: AuthContext,
  id: string,
  input: RecordPaymentData,
): Promise<InvoiceDto> {
  const { tenant, invoice, status } = await loadInvoice(auth, id);
  if (!canRecordPayment(status, invoice.balanceDue)) throw conflict(paymentRuleViolation(status));
  if (input.amount > invoice.balanceDue) {
    throw validationFailed([{ path: 'amount', message: 'Payment exceeds the balance due' }]);
  }
  const paidAt = input.paidAt ?? tenant.today;
  if (paidAt > tenant.today) {
    throw validationFailed([
      { path: 'paidAt', message: 'The payment date cannot be in the future' },
    ]);
  }

  invoice.payments.push({
    amount: input.amount,
    method: input.method,
    paidAt: isoDateToUtcDate(paidAt),
    reference: blankToUndefined(input.reference),
    note: blankToUndefined(input.note),
    recordedBy: auth.userId,
  });
  invoice.set(statusAfterPayments(invoice));
  await invoice.save();
  return toInvoiceDto(invoice, tenant.today);
}

export async function deletePayment(
  auth: AuthContext,
  id: string,
  paymentId: string,
): Promise<InvoiceDto> {
  const { tenant, invoice } = await loadInvoice(auth, id);
  if (!invoice.payments.id(paymentId)) throw notFound('Payment not found.');

  // Replacing the array (rather than pulling the subdocument) writes the exact remaining list.
  invoice.set(
    'payments',
    invoice.payments.filter((payment) => !payment._id.equals(paymentId)),
  );
  invoice.set(statusAfterPayments(invoice));
  await invoice.save();
  return toInvoiceDto(invoice, tenant.today);
}

function cancelRuleViolation(status: InvoiceStatus): string {
  if (status === 'cancelled') return 'This invoice is already cancelled.';
  if (status === 'paid') return 'Paid invoices cannot be cancelled.';
  return 'Invoices with recorded payments cannot be cancelled. Delete the payments first.';
}

export async function cancelInvoice(auth: AuthContext, id: string): Promise<InvoiceDto> {
  const { tenant, invoice, status } = await loadInvoice(auth, id);
  if (!canCancelInvoice(status, invoice.amountPaid)) throw conflict(cancelRuleViolation(status));
  invoice.status = 'cancelled';
  invoice.cancelledAt = new Date();
  await invoice.save();
  return toInvoiceDto(invoice, tenant.today);
}

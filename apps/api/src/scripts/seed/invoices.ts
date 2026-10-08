import type { InvoiceStatus } from '@quoteflow/shared';
import type { Types } from 'mongoose';
import {
  type Invoice,
  type InvoiceDocument,
  InvoiceModel,
  type LineItem,
  type QuoteDocument,
  toCustomerSnapshot,
} from '../../models';
import { nextDocumentNumber } from '../../services/numbering.service';
import { generatePublicToken } from '../../utils/tokens';
import {
  type InvoicePlan,
  type PaymentPlan,
  STANDALONE_INVOICE_PLANS,
  type StandaloneInvoicePlan,
} from '../seed-data/documents';
import { type SeedClock, addDays, addHours } from './clock';
import { buildLineItems } from './line-items';
import type { SeededQuote } from './quotes';
import type { DemoTenant } from './tenant';

type InvoiceContent = Pick<
  Invoice,
  'customerId' | 'customer' | 'currency' | 'discount' | 'taxRate' | 'notes' | 'terms' | 'createdBy'
> & { items: Omit<LineItem, 'amount'>[]; quoteId?: Types.ObjectId };

interface InvoiceJob {
  plan: InvoicePlan;
  issueDate: Date;
  content: InvoiceContent;
  /** Set when the invoice is converted from this quote. */
  quote?: QuoteDocument;
}

/** Conversion copies everything billed on the quote, so the invoice matches what was accepted. */
function contentFromQuote(quote: QuoteDocument): InvoiceContent {
  return {
    quoteId: quote._id,
    customerId: quote.customerId,
    customer: quote.customer,
    currency: quote.currency,
    items: quote.items,
    discount: quote.discount,
    taxRate: quote.taxRate,
    notes: quote.notes,
    terms: quote.terms,
    createdBy: quote.createdBy,
  };
}

function standaloneContent(plan: StandaloneInvoicePlan, tenant: DemoTenant): InvoiceContent {
  const { business, users, customers, services } = tenant;
  const customer = customers[plan.customer];
  return {
    customerId: customer._id,
    customer: toCustomerSnapshot(customer),
    currency: business.currency,
    items: buildLineItems(plan.items, services),
    discount: plan.discount ?? null,
    taxRate: business.defaultTaxRate,
    notes: business.defaultInvoiceNotes,
    terms: business.defaultInvoiceTerms,
    createdBy: users[plan.createdBy ?? 'owner']._id,
  };
}

function conversionDate(quote: QuoteDocument, clock: SeedClock): Date {
  if (!quote.acceptedAt) throw new Error(`Seed plan: quote ${quote.quoteNumber} was not accepted`);
  return clock.notAfterNow(addDays(quote.acceptedAt, 1));
}

/** Catches plans whose due date contradicts their status, e.g. an overdue invoice not yet due. */
function assertCoherent(status: InvoiceStatus, dueDate: Date, now: Date): void {
  const pastDue = dueDate < now;
  if (status === 'overdue' && !pastDue)
    throw new Error('Seed plan: overdue invoice is not due yet');
  if ((status === 'sent' || status === 'partially_paid') && pastDue) {
    throw new Error(`Seed plan: ${status} invoice is already past due`);
  }
}

function recordPayments(
  invoice: InvoiceDocument,
  payments: readonly PaymentPlan[],
  clock: SeedClock,
): void {
  const { total } = invoice.totals;
  for (const payment of payments) {
    const paidSoFar = invoice.payments.reduce((sum, recorded) => sum + recorded.amount, 0);
    const paidAt = clock.notAfterNow(addDays(invoice.issueDate, payment.daysAfterIssue));
    invoice.payments.push({
      amount: payment.share === 'balance' ? total - paidSoFar : Math.round(total * payment.share),
      method: payment.method,
      paidAt,
      reference: payment.reference,
      recordedBy: invoice.createdBy,
      createdAt: paidAt,
    });
  }
}

function applyStatus(invoice: InvoiceDocument, status: InvoiceStatus, clock: SeedClock): void {
  invoice.status = status;
  if (status !== 'draft') invoice.sentAt = clock.notAfterNow(addHours(invoice.issueDate, 1));
  if (status === 'cancelled')
    invoice.cancelledAt = clock.notAfterNow(addDays(invoice.issueDate, 2));
  if (status === 'paid') invoice.paidAt = invoice.payments.at(-1)?.paidAt;
}

async function createInvoice(
  { business }: DemoTenant,
  clock: SeedClock,
  job: InvoiceJob,
): Promise<InvoiceDocument> {
  const dueDate = addDays(job.issueDate, business.invoiceDueDays);
  assertCoherent(job.plan.status, dueDate, clock.now);

  const invoice = new InvoiceModel({
    ...job.content,
    businessId: business._id,
    invoiceNumber: await nextDocumentNumber(business._id, 'invoice', business.invoicePrefix),
    status: 'draft',
    issueDate: job.issueDate,
    dueDate,
    publicToken: generatePublicToken(),
    createdAt: job.issueDate,
  });
  // Validating runs the hook that derives the totals the planned payment shares refer to.
  await invoice.validate();
  recordPayments(invoice, job.plan.payments ?? [], clock);
  applyStatus(invoice, job.plan.status, clock);
  return invoice.save();
}

/**
 * Converts the planned quotes and creates the standalone invoices, oldest
 * first so invoice numbers follow issue dates. Converted quotes are linked to
 * their invoice.
 */
export async function createInvoices(
  tenant: DemoTenant,
  clock: SeedClock,
  quotes: readonly SeededQuote[],
): Promise<InvoiceDocument[]> {
  const conversions = quotes.flatMap(({ plan, quote }): InvoiceJob[] => {
    if (!plan.invoice) return [];
    const issueDate = conversionDate(quote, clock);
    return [{ plan: plan.invoice, quote, issueDate, content: contentFromQuote(quote) }];
  });
  const standalone = STANDALONE_INVOICE_PLANS.map((plan): InvoiceJob => ({
    plan,
    issueDate: clock.daysAgo(plan.daysAgo),
    content: standaloneContent(plan, tenant),
  }));
  const jobs = [...conversions, ...standalone].sort(
    (a, b) => a.issueDate.getTime() - b.issueDate.getTime(),
  );

  const invoices: InvoiceDocument[] = [];
  for (const job of jobs) {
    const invoice = await createInvoice(tenant, clock, job);
    if (job.quote) {
      job.quote.invoiceId = invoice._id;
      job.quote.convertedAt = invoice.issueDate;
      await job.quote.save();
    }
    invoices.push(invoice);
  }
  return invoices;
}

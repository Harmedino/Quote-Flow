import {
  type InvoiceDto,
  addDaysToIsoDate,
  canConvertQuote,
  getEffectiveQuoteStatus,
  isoDateToUtcDate,
  todayInTimeZone,
} from '@quoteflow/shared';
import type { Types } from 'mongoose';
import { isDuplicateKeyError } from '../db/errors';
import { InvoiceModel, type QuoteDocument, QuoteModel, toCustomerSnapshot } from '../models';
import { toInvoiceDto } from '../serializers/invoice.serializer';
import { toIsoDate } from '../serializers/sales-document.serializer';
import { conflict, notFound } from '../utils/app-error';
import { generatePublicToken } from '../utils/tokens';
import type { AuthContext } from './access-token.service';
import { blankToUndefined, findOwnBusiness } from './invoice-content';
import { nextDocumentNumber } from './numbering.service';

export const ALREADY_CONVERTED = 'This quote has already been converted to an invoice';
export const ONLY_ACCEPTED = 'Only accepted quotes can be converted';

/**
 * Links the quote to its invoice with a status-only atomic update, so the
 * quote's content (and derived totals) are never touched.
 */
async function linkQuoteToInvoice(quote: QuoteDocument, invoiceId: Types.ObjectId): Promise<void> {
  await QuoteModel.updateOne(
    { _id: quote._id, businessId: quote.businessId, invoiceId: null },
    { $set: { invoiceId, convertedAt: new Date() } },
  ).setOptions({ allowAtomicUpdate: true });
}

/** An invoice already created from the quote, e.g. by a concurrent or interrupted conversion. */
async function findConvertedInvoiceId(quote: QuoteDocument): Promise<Types.ObjectId | null> {
  const existing = await InvoiceModel.findOne(
    { businessId: quote.businessId, quoteId: quote._id },
    { _id: 1 },
  ).lean();
  return existing?._id ?? null;
}

/** Records the link that an earlier conversion did not get to, then reports the conflict. */
async function repairAndReject(quote: QuoteDocument, invoiceId: Types.ObjectId): Promise<never> {
  await linkQuoteToInvoice(quote, invoiceId);
  throw conflict(ALREADY_CONVERTED);
}

function isQuoteIdConflict(error: unknown): boolean {
  if (!isDuplicateKeyError(error)) return false;
  const keys = (error as { keyPattern?: Record<string, unknown> }).keyPattern;
  // Servers that omit keyPattern are treated as a quoteId conflict; the lookup that follows decides.
  return keys === undefined || 'quoteId' in keys;
}

/**
 * Turns an accepted quote into a draft invoice that bills exactly what was
 * accepted. A quote converts at most once: the unique index on
 * Invoice.quoteId rejects a concurrent second conversion, and the quote is
 * re-linked if an earlier conversion stopped before linking it.
 */
export async function convertQuote(auth: AuthContext, quoteId: string): Promise<InvoiceDto> {
  const business = await findOwnBusiness(auth);
  const businessId = business._id;
  const today = todayInTimeZone(business.timezone);

  const quote = await QuoteModel.findOne({ _id: quoteId, businessId });
  if (!quote) throw notFound('Quote not found.');
  if (quote.invoiceId) throw conflict(ALREADY_CONVERTED);

  const status = getEffectiveQuoteStatus(quote.status, toIsoDate(quote.expiryDate), today);
  if (!canConvertQuote(status, null)) throw conflict(ONLY_ACCEPTED);

  const convertedId = await findConvertedInvoiceId(quote);
  if (convertedId) return repairAndReject(quote, convertedId);

  const invoice = new InvoiceModel({
    businessId,
    invoiceNumber: await nextDocumentNumber(businessId, 'invoice', business.invoicePrefix),
    quoteId: quote._id,
    status: 'draft',
    customerId: quote.customerId,
    customer: toCustomerSnapshot(quote.customer),
    currency: quote.currency,
    items: quote.items.map((item) => ({
      serviceId: item.serviceId,
      name: item.name,
      description: blankToUndefined(item.description),
      quantity: item.quantity,
      unit: blankToUndefined(item.unit),
      unitPrice: item.unitPrice,
    })),
    discount: quote.discount ? { type: quote.discount.type, value: quote.discount.value } : null,
    taxRate: quote.taxRate,
    notes: business.defaultInvoiceNotes || blankToUndefined(quote.notes),
    terms: business.defaultInvoiceTerms || blankToUndefined(quote.terms),
    issueDate: isoDateToUtcDate(today),
    dueDate: isoDateToUtcDate(addDaysToIsoDate(today, business.invoiceDueDays)),
    publicToken: generatePublicToken(),
    createdBy: auth.userId,
  });

  try {
    await invoice.save();
  } catch (error) {
    if (!isQuoteIdConflict(error)) throw error;
    const winner = await findConvertedInvoiceId(quote);
    if (!winner) throw error;
    return repairAndReject(quote, winner);
  }

  await linkQuoteToInvoice(quote, invoice._id);
  return toInvoiceDto(invoice, today);
}

import {
  type PaginationMeta,
  type QuoteDto,
  type QuoteListItemDto,
  type QuoteStatus,
  addDaysToIsoDate,
  canDeleteQuote,
  canEditQuote,
  canSendQuote,
  getEffectiveQuoteStatus,
  isoDateToUtcDate,
  type quoteInputSchema,
  type quoteListQuerySchema,
  todayInTimeZone,
} from '@quoteflow/shared';
import { type QueryFilter, Types } from 'mongoose';
import type { z } from 'zod';
import {
  type BusinessDocument,
  BusinessModel,
  type CustomerDocument,
  CustomerModel,
  type CustomerSnapshot,
  type Discount,
  type LineItem,
  type Quote,
  type QuoteDocument,
  QuoteModel,
  ServiceModel,
  toCustomerSnapshot,
} from '../models';
import {
  QUOTE_LIST_PROJECTION,
  type QuoteListRecord,
  toQuoteDto,
  toQuoteListItemDto,
} from '../serializers/quote.serializer';
import { toIsoDate } from '../serializers/sales-document.serializer';
import { AppError, conflict, notFound, sessionExpired, validationFailed } from '../utils/app-error';
import { generatePublicToken } from '../utils/tokens';
import type { AuthContext } from './access-token.service';
import { nextDocumentNumber } from './numbering.service';

export type QuoteInputData = z.output<typeof quoteInputSchema>;
export type QuoteListQueryData = z.output<typeof quoteListQuerySchema>;
type LineItemInputData = QuoteInputData['items'][number];

export interface QuoteList {
  data: QuoteListItemDto[];
  meta: PaginationMeta;
}

/** Context every quote operation needs: the tenant and today's date in its time zone. */
interface QuoteContext {
  business: BusinessDocument;
  today: string;
}

async function loadContext(auth: AuthContext): Promise<QuoteContext> {
  const business = await BusinessModel.findById(auth.businessId);
  if (!business) throw sessionExpired();
  return { business, today: todayInTimeZone(business.timezone) };
}

async function findOwnQuote(auth: AuthContext, id: string): Promise<QuoteDocument> {
  const quote = await QuoteModel.findOne({ _id: id, businessId: auth.businessId });
  if (!quote) throw notFound('Quote not found.');
  return quote;
}

function effectiveStatusOf(quote: QuoteDocument, today: string): QuoteStatus {
  return getEffectiveQuoteStatus(quote.status, toIsoDate(quote.expiryDate), today);
}

/** The customer a quote is for: it must belong to the business and not be archived. */
async function findQuotableCustomer(
  auth: AuthContext,
  customerId: string,
): Promise<CustomerDocument> {
  const customer = await CustomerModel.findOne({ _id: customerId, businessId: auth.businessId });
  if (!customer) {
    throw validationFailed([{ path: 'customerId', message: 'Customer not found' }]);
  }
  if (customer.archivedAt) {
    const message = 'This customer is archived. Restore them to create or update quotes for them.';
    throw new AppError('CONFLICT', message, { details: [{ path: 'customerId', message }] });
  }
  return customer;
}

/** Every referenced service must belong to the business (inactive ones are allowed on edits). */
async function assertOwnServices(
  auth: AuthContext,
  items: readonly LineItemInputData[],
): Promise<void> {
  const ids = [...new Set(items.flatMap((item) => (item.serviceId ? [item.serviceId] : [])))];
  if (ids.length === 0) return;
  const found = await ServiceModel.find({ _id: { $in: ids }, businessId: auth.businessId })
    .select('_id')
    .lean();
  const known = new Set(found.map((service) => service._id.toString()));
  const details = items.flatMap((item, index) =>
    item.serviceId && !known.has(item.serviceId)
      ? [{ path: `items.${index}.serviceId`, message: 'Service not found' }]
      : [],
  );
  if (details.length > 0) throw validationFailed(details);
}

const emptyToUndefined = (value: string | undefined) => (value ? value : undefined);

function toLineItems(items: readonly LineItemInputData[]): LineItemFields[] {
  return items.map((item) => ({
    serviceId: item.serviceId ? new Types.ObjectId(item.serviceId) : undefined,
    name: item.name,
    description: emptyToUndefined(item.description),
    quantity: item.quantity,
    unit: emptyToUndefined(item.unit),
    unitPrice: item.unitPrice,
  }));
}

/** Omitted text falls back to the given value; an empty string clears it. */
function textOrFallback(value: string | undefined, fallback: string | undefined) {
  return value === undefined ? fallback : emptyToUndefined(value);
}

/** Line amounts are derived when the quote is validated. */
type LineItemFields = Omit<LineItem, 'amount'>;

interface DraftFields {
  customerId: Types.ObjectId;
  customer: CustomerSnapshot;
  items: LineItemFields[];
  discount: Discount | null;
  taxRate: number;
  notes: string | undefined;
  terms: string | undefined;
  /** 'YYYY-MM-DD'; defaults to today and today + the business's validity days. */
  issueDate?: string;
  expiryDate?: string;
}

async function newDraft(
  auth: AuthContext,
  { business, today }: QuoteContext,
  fields: DraftFields,
): Promise<QuoteDocument> {
  const issueDate = fields.issueDate ?? today;
  const expiryDate = fields.expiryDate ?? addDaysToIsoDate(issueDate, business.quoteValidityDays);
  const quote = new QuoteModel({
    businessId: business._id,
    quoteNumber: await nextDocumentNumber(business._id, 'quote', business.quotePrefix),
    status: 'draft',
    customerId: fields.customerId,
    customer: fields.customer,
    currency: business.currency,
    items: fields.items,
    discount: fields.discount,
    taxRate: fields.taxRate,
    notes: fields.notes,
    terms: fields.terms,
    issueDate: isoDateToUtcDate(issueDate),
    expiryDate: isoDateToUtcDate(expiryDate),
    publicToken: generatePublicToken(),
    createdBy: auth.userId,
  });
  await quote.save();
  return quote;
}

const REGEX_SPECIAL_CHARACTERS = /[.*+?^${}()|[\]\\]/g;

export function escapeRegex(value: string): string {
  return value.replace(REGEX_SPECIAL_CHARACTERS, '\\$&');
}

/** The filter for a status tab, matching the effective status every response reports. */
export function statusFilter(status: QuoteStatus, today: string): QueryFilter<Quote> {
  const startOfToday = isoDateToUtcDate(today);
  if (status === 'expired') {
    return {
      $or: [
        { status: 'expired' },
        { status: { $in: ['sent', 'viewed'] }, expiryDate: { $lt: startOfToday } },
      ],
    };
  }
  if (status === 'sent' || status === 'viewed') {
    return { status, expiryDate: { $gte: startOfToday } };
  }
  return { status };
}

export async function listQuotes(auth: AuthContext, query: QuoteListQueryData): Promise<QuoteList> {
  const { today } = await loadContext(auth);
  const conditions: QueryFilter<Quote>[] = [];
  if (query.status) conditions.push(statusFilter(query.status, today));
  if (query.customerId) conditions.push({ customerId: new Types.ObjectId(query.customerId) });
  if (query.search) {
    const pattern = new RegExp(escapeRegex(query.search), 'i');
    conditions.push({ $or: [{ quoteNumber: pattern }, { 'customer.name': pattern }] });
  }
  const filter: QueryFilter<Quote> = {
    businessId: auth.businessId,
    ...(conditions.length > 0 && { $and: conditions }),
  };

  const { page, pageSize } = query;
  const [records, total] = await Promise.all([
    QuoteModel.find(filter)
      .select(QUOTE_LIST_PROJECTION)
      .sort({ createdAt: -1, _id: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .lean<QuoteListRecord[]>(),
    QuoteModel.countDocuments(filter),
  ]);

  return {
    data: records.map((record) => toQuoteListItemDto(record, today)),
    meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
  };
}

export async function getQuote(auth: AuthContext, id: string): Promise<QuoteDto> {
  const [{ today }, quote] = await Promise.all([loadContext(auth), findOwnQuote(auth, id)]);
  return toQuoteDto(quote, today);
}

export async function createQuote(auth: AuthContext, input: QuoteInputData): Promise<QuoteDto> {
  const context = await loadContext(auth);
  const { business } = context;
  const [customer] = await Promise.all([
    findQuotableCustomer(auth, input.customerId),
    assertOwnServices(auth, input.items),
  ]);
  const quote = await newDraft(auth, context, {
    customerId: customer._id,
    customer: toCustomerSnapshot(customer),
    items: toLineItems(input.items),
    discount: input.discount ?? null,
    taxRate: input.taxRate ?? business.defaultTaxRate,
    notes: textOrFallback(input.notes, business.defaultQuoteNotes),
    terms: textOrFallback(input.terms, business.defaultQuoteTerms),
    issueDate: input.issueDate,
    expiryDate: input.expiryDate,
  });
  return toQuoteDto(quote, context.today);
}

/**
 * Replaces the quote's content. Omitted optional fields keep their current
 * values ('' clears notes or terms, `discount: null` removes the discount).
 */
export async function updateQuote(
  auth: AuthContext,
  id: string,
  input: QuoteInputData,
): Promise<QuoteDto> {
  const [{ today }, quote] = await Promise.all([loadContext(auth), findOwnQuote(auth, id)]);
  if (!canEditQuote(effectiveStatusOf(quote, today))) {
    throw conflict('Accepted and rejected quotes can no longer be edited.');
  }

  const customerChanged = quote.customerId.toString() !== input.customerId;
  // Its public link shows the customer's details and lets them answer, so it keeps its recipient.
  if (customerChanged && quote.status !== 'draft') {
    const message =
      'This quote has already been sent to its customer. To quote someone else, duplicate it and change the customer on the copy.';
    throw new AppError('CONFLICT', message, { details: [{ path: 'customerId', message }] });
  }
  const [customer] = await Promise.all([
    customerChanged ? findQuotableCustomer(auth, input.customerId) : undefined,
    assertOwnServices(auth, input.items),
  ]);
  if (customer) {
    quote.customerId = customer._id;
    quote.customer = toCustomerSnapshot(customer);
  }

  quote.set('items', toLineItems(input.items));
  if (input.discount !== undefined) quote.discount = input.discount;
  if (input.taxRate !== undefined) quote.taxRate = input.taxRate;
  if (input.notes !== undefined) quote.notes = emptyToUndefined(input.notes);
  if (input.terms !== undefined) quote.terms = emptyToUndefined(input.terms);
  if (input.issueDate) quote.issueDate = isoDateToUtcDate(input.issueDate);
  if (input.expiryDate) quote.expiryDate = isoDateToUtcDate(input.expiryDate);
  // A customer looking at the previous version can no longer answer it.
  quote.revision = (quote.revision ?? 0) + 1;

  // Revising an expired quote with a new validity period makes it live again.
  if (quote.status === 'expired' && toIsoDate(quote.expiryDate) >= today) {
    quote.status = 'sent';
  }

  await quote.save();
  return toQuoteDto(quote, today);
}

export async function deleteQuote(auth: AuthContext, id: string): Promise<void> {
  const [{ today }, quote] = await Promise.all([loadContext(auth), findOwnQuote(auth, id)]);
  if (!canDeleteQuote(effectiveStatusOf(quote, today))) {
    throw conflict('Only draft quotes can be deleted.');
  }
  await QuoteModel.deleteOne({ _id: quote._id, businessId: auth.businessId, status: 'draft' });
}

const SEND_REFUSALS: Partial<Record<QuoteStatus, string>> = {
  expired: 'This quote has expired. Update its expiry date to send it again.',
  accepted: 'This quote has already been accepted.',
  rejected: 'This quote has been rejected. Duplicate it to send a new version.',
};

/** Marks a draft as sent. Sending a quote that is already out is a no-op. */
export async function sendQuote(auth: AuthContext, id: string): Promise<QuoteDto> {
  const [{ today }, quote] = await Promise.all([loadContext(auth), findOwnQuote(auth, id)]);
  const status = effectiveStatusOf(quote, today);
  if (!canSendQuote(status)) {
    throw conflict(SEND_REFUSALS[status] ?? 'This quote cannot be sent.');
  }
  if (quote.status === 'draft') {
    // Drafts never count as expired, but once sent this one would reach the customer expired.
    if (toIsoDate(quote.expiryDate) < today) {
      throw conflict('This quote’s expiry date has passed. Update its expiry date to send it.');
    }
    quote.status = 'sent';
    quote.sentAt = new Date();
    await quote.save();
  }
  return toQuoteDto(quote, today);
}

/** A new draft with the same content, for the customer as they are now, with fresh dates. */
export async function duplicateQuote(auth: AuthContext, id: string): Promise<QuoteDto> {
  const [context, source] = await Promise.all([loadContext(auth), findOwnQuote(auth, id)]);
  const customer = await findQuotableCustomer(auth, source.customerId.toString());
  const quote = await newDraft(auth, context, {
    customerId: customer._id,
    customer: toCustomerSnapshot(customer),
    items: source.items.map((item) => ({
      serviceId: item.serviceId,
      name: item.name,
      description: item.description,
      quantity: item.quantity,
      unit: item.unit,
      unitPrice: item.unitPrice,
    })),
    discount: source.discount ? { type: source.discount.type, value: source.discount.value } : null,
    taxRate: source.taxRate,
    notes: source.notes,
    terms: source.terms,
  });
  return toQuoteDto(quote, context.today);
}

import {
  type PublicInvoiceDto,
  type PublicQuoteDto,
  type QuoteStatus,
  canRespondToQuote,
  getEffectiveQuoteStatus,
  isoDateToUtcDate,
  todayInTimeZone,
} from '@quoteflow/shared';
import type { Types } from 'mongoose';
import { type Business, BusinessModel, InvoiceModel, type Quote, QuoteModel } from '../models';
import { toPublicInvoiceDto, toPublicQuoteDto } from '../serializers/public-document.serializer';
import { toIsoDate } from '../serializers/sales-document.serializer';
import { type AppError, conflict, notFound } from '../utils/app-error';
import type { Clock } from '../utils/clock';
import { PUBLIC_TOKEN_PATTERN } from '../utils/tokens';

/**
 * Customer-facing quotes and invoices. Customers have no account: the 256-bit
 * public token in the link is the capability. Looking a document up by its
 * token is the one deliberate cross-tenant query here; every follow-up query
 * is scoped by the document's own businessId.
 */

const QUOTE_NOT_FOUND = 'This quote link is invalid or no longer available.';
const INVOICE_NOT_FOUND = 'This invoice link is invalid or no longer available.';

/** A repeat view within this window of the last recorded one (e.g. a refresh) is not written. */
export const VIEW_RECORD_INTERVAL_MS = 60_000;

const LIVE_STATUSES: QuoteStatus[] = ['sent', 'viewed'];

type QuoteRecord = Quote & { _id: Types.ObjectId };
export type QuoteResponse = { action: 'accept' } | { action: 'reject'; reason?: string };

export interface PublicDocumentService {
  viewQuote(token: string): Promise<PublicQuoteDto>;
  respondToQuote(token: string, response: QuoteResponse): Promise<PublicQuoteDto>;
  viewInvoice(token: string): Promise<PublicInvoiceDto>;
}

async function findQuoteByToken(token: string): Promise<QuoteRecord | null> {
  // Malformed tokens are rejected without touching the database.
  if (!PUBLIC_TOKEN_PATTERN.test(token)) return null;
  return QuoteModel.findOne({ publicToken: token, status: { $ne: 'draft' } })
    .setOptions({ skipTenantGuard: true })
    .lean();
}

async function findBusiness(businessId: Types.ObjectId): Promise<Business | null> {
  return BusinessModel.findById(businessId).lean();
}

function cannotRespond(status: QuoteStatus, businessName: string): AppError {
  switch (status) {
    case 'accepted':
      return conflict('This quote has already been accepted.');
    case 'rejected':
      return conflict('This quote has already been declined.');
    case 'expired':
      return conflict(
        `This quote has expired. Please contact ${businessName} for an updated quote.`,
      );
    default:
      // Changed between reading and answering it (e.g. revised by the business).
      return conflict('This quote was just updated. Please refresh the page and try again.');
  }
}

export function createPublicDocumentService({ clock }: { clock: Clock }): PublicDocumentService {
  async function loadQuote(token: string) {
    const quote = await findQuoteByToken(token);
    const business = quote && (await findBusiness(quote.businessId));
    if (!quote || !business) throw notFound(QUOTE_NOT_FOUND);
    const now = clock();
    const today = todayInTimeZone(business.timezone, now);
    const status = getEffectiveQuoteStatus(quote.status, toIsoDate(quote.expiryDate), today);
    return { quote, business, now, today, status };
  }

  /**
   * Marks the first view of a sent quote and keeps lastViewedAt current, only
   * while the quote is live. Conditional on the status read, so a view never
   * overwrites an answer that landed in between.
   */
  async function recordView(quote: QuoteRecord, now: Date): Promise<QuoteRecord> {
    const firstView = quote.status === 'sent';
    const lastViewedAt = quote.lastViewedAt?.getTime();
    if (!firstView && lastViewedAt && now.getTime() - lastViewedAt < VIEW_RECORD_INTERVAL_MS) {
      return quote;
    }
    const changes: Partial<Quote> = firstView
      ? { status: 'viewed', viewedAt: now, lastViewedAt: now }
      : { lastViewedAt: now };
    const scope = { _id: quote._id, businessId: quote.businessId };
    const result = await QuoteModel.updateOne({ ...scope, status: quote.status }, { $set: changes })
      .setOptions({ allowAtomicUpdate: true })
      .exec();
    if (result.matchedCount > 0) return { ...quote, ...changes };
    return (await QuoteModel.findOne(scope).lean()) ?? quote;
  }

  return {
    async viewQuote(token) {
      const { quote, business, now, today, status } = await loadQuote(token);
      const viewed = canRespondToQuote(status) ? await recordView(quote, now) : quote;
      return toPublicQuoteDto(viewed, business, today);
    },

    async respondToQuote(token, response) {
      const { quote, business, now, today, status } = await loadQuote(token);
      if (!canRespondToQuote(status)) throw cannotRespond(status, business.name);

      const scope = { _id: quote._id, businessId: quote.businessId };
      const update =
        response.action === 'accept'
          ? { $set: { status: 'accepted', acceptedAt: now } }
          : response.reason
            ? { $set: { status: 'rejected', rejectedAt: now, rejectionReason: response.reason } }
            : { $set: { status: 'rejected', rejectedAt: now }, $unset: { rejectionReason: 1 } };

      // Only a still-live, unexpired quote changes, so of two concurrent answers exactly one wins.
      const answered = await QuoteModel.findOneAndUpdate(
        {
          ...scope,
          status: { $in: LIVE_STATUSES },
          expiryDate: { $gte: isoDateToUtcDate(today) },
        },
        update,
        { returnDocument: 'after', allowAtomicUpdate: true },
      ).lean();

      if (!answered) {
        const current = await QuoteModel.findOne(scope).lean();
        const currentStatus = current
          ? getEffectiveQuoteStatus(current.status, toIsoDate(current.expiryDate), today)
          : status;
        throw cannotRespond(currentStatus, business.name);
      }
      return toPublicQuoteDto(answered, business, today);
    },

    async viewInvoice(token) {
      const invoice = PUBLIC_TOKEN_PATTERN.test(token)
        ? await InvoiceModel.findOne({ publicToken: token, status: { $ne: 'draft' } })
            .setOptions({ skipTenantGuard: true })
            .lean()
        : null;
      const business = invoice && (await findBusiness(invoice.businessId));
      if (!invoice || !business) throw notFound(INVOICE_NOT_FOUND);
      return toPublicInvoiceDto(invoice, business, todayInTimeZone(business.timezone, clock()));
    },
  };
}

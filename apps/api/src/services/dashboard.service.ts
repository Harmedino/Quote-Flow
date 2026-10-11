import {
  type DashboardDto,
  type InvoiceStatus,
  type QuoteStatus,
  isoDateToUtcDate,
  todayInTimeZone,
} from '@quoteflow/shared';
import { Types } from 'mongoose';
import { type Business, BusinessModel, CustomerModel, InvoiceModel, QuoteModel } from '../models';
import {
  INVOICE_LIST_PROJECTION,
  type InvoiceListRecord,
  toInvoiceListItemDto,
} from '../serializers/invoice.serializer';
import {
  QUOTE_LIST_PROJECTION,
  type QuoteListRecord,
  toQuoteListItemDto,
} from '../serializers/quote.serializer';
import { sessionExpired } from '../utils/app-error';
import type { Clock } from '../utils/clock';
import type { AuthContext } from './access-token.service';
import { dashboardActivity } from './dashboard-activity';

const LIST_SIZE = 5;

/** A waiting quote also carries its link and the customer's phone, for a WhatsApp follow-up. */
type AwaitingQuoteRecord = QuoteListRecord & {
  publicToken: string;
  customer: { name: string; phone?: string };
};
const AWAITING_QUOTE_PROJECTION = `${QUOTE_LIST_PROJECTION} publicToken customer.phone`;

/** Issued and not cancelled: what the business has billed. */
const BILLED_STATUSES: InvoiceStatus[] = ['sent', 'partially_paid', 'paid', 'overdue'];
/** Waiting for the customer's answer (until the expiry date). */
const PENDING_QUOTE_STATUSES: QuoteStatus[] = ['sent', 'viewed'];
/** Issued and awaiting money. 'overdue' is also derived from the due date (see below). */
const UNPAID_STATUSES: InvoiceStatus[] = ['sent', 'partially_paid', 'overdue'];

/**
 * Sums one invoice field. Each total is its own `$group` with a single
 * accumulator, which also keeps it portable to MongoDB-compatible stores
 * (FerretDB) that evaluate only the first accumulator of a group.
 */
async function sumInvoices(match: Record<string, unknown>, field: string): Promise<number> {
  const [row] = await InvoiceModel.aggregate<{ total: number }>([
    { $match: match },
    { $group: { _id: null, total: { $sum: `$${field}` } } },
  ]);
  return row?.total ?? 0;
}

export interface DashboardService {
  getDashboard(auth: AuthContext): Promise<DashboardDto>;
}

export function createDashboardService({ clock }: { clock: Clock }): DashboardService {
  return {
    async getDashboard(auth) {
      const business = await BusinessModel.findById(auth.businessId).lean<Business>();
      if (!business) throw sessionExpired();
      const today = todayInTimeZone(business.timezone, clock());
      const startOfToday = isoDateToUtcDate(today);
      // Aggregations do not cast, so the tenant id must already be an ObjectId.
      const businessId = new Types.ObjectId(auth.businessId);
      const { currency } = business;

      // Money is only added up within the current currency; counts cover every document.
      const billed = { businessId, currency, status: { $in: BILLED_STATUSES } };
      const unpaid = { businessId, currency, status: { $in: UNPAID_STATUSES } };
      // The effective rule: unpaid, with a balance, after the due date.
      const overdueInAnyCurrency = {
        businessId,
        status: { $in: UNPAID_STATUSES },
        balanceDue: { $gt: 0 },
        dueDate: { $lt: startOfToday },
      };

      const pending = {
        businessId,
        status: { $in: PENDING_QUOTE_STATUSES },
        expiryDate: { $gte: startOfToday },
      };
      const readyToInvoice = { businessId, status: 'accepted' as const, invoiceId: null };

      const [
        totalQuotes,
        pendingQuotes,
        viewedQuotes,
        acceptedQuotes,
        acceptedNotInvoiced,
        totalInvoices,
        totalInvoiced,
        amountPaid,
        outstanding,
        outstandingCount,
        overdueCount,
        overdueAmount,
        activeCustomers,
        awaitingQuotes,
        quotesToInvoice,
        upcomingInvoices,
        activity,
      ] = await Promise.all([
        QuoteModel.countDocuments({ businessId }),
        QuoteModel.countDocuments(pending),
        QuoteModel.countDocuments({ ...pending, status: 'viewed' as const }),
        QuoteModel.countDocuments({ businessId, status: 'accepted' }),
        QuoteModel.countDocuments(readyToInvoice),
        InvoiceModel.countDocuments({ businessId }),
        sumInvoices(billed, 'totals.total'),
        sumInvoices(billed, 'amountPaid'),
        sumInvoices(unpaid, 'balanceDue'),
        InvoiceModel.countDocuments({ ...unpaid, balanceDue: { $gt: 0 } }),
        InvoiceModel.countDocuments(overdueInAnyCurrency),
        sumInvoices({ ...overdueInAnyCurrency, currency }, 'balanceDue'),
        CustomerModel.countDocuments({ businessId, archivedAt: null }),
        QuoteModel.find(pending)
          .select(AWAITING_QUOTE_PROJECTION)
          .sort({ issueDate: -1, _id: -1 })
          .limit(LIST_SIZE)
          .lean<AwaitingQuoteRecord[]>(),
        QuoteModel.find(readyToInvoice)
          .select(QUOTE_LIST_PROJECTION)
          .sort({ acceptedAt: -1, _id: -1 })
          .limit(LIST_SIZE)
          .lean<QuoteListRecord[]>(),
        InvoiceModel.find({ businessId, status: { $in: UNPAID_STATUSES }, balanceDue: { $gt: 0 } })
          .select(INVOICE_LIST_PROJECTION)
          .sort({ dueDate: 1, _id: 1 })
          .limit(LIST_SIZE)
          .lean<InvoiceListRecord[]>(),
        dashboardActivity(businessId, currency, today),
      ]);

      return {
        currency,
        quotes: {
          total: totalQuotes,
          pending: pendingQuotes,
          viewed: viewedQuotes,
          accepted: acceptedQuotes,
          acceptedNotInvoiced,
        },
        invoices: {
          total: totalInvoices,
          totalInvoiced,
          amountPaid,
          outstanding,
          outstandingCount,
          overdueCount,
          overdueAmount,
        },
        customers: { total: activeCustomers },
        activity,
        awaitingQuotes: awaitingQuotes.map((quote) => ({
          ...toQuoteListItemDto(quote, today),
          publicToken: quote.publicToken,
          customerPhone: quote.customer.phone ?? null,
        })),
        readyToInvoice: quotesToInvoice.map((quote) => toQuoteListItemDto(quote, today)),
        upcomingInvoices: upcomingInvoices.map((invoice) => toInvoiceListItemDto(invoice, today)),
      };
    },
  };
}

import {
  type DashboardDto,
  type InvoiceStatus,
  isoDateToUtcDate,
  todayInTimeZone,
} from '@quoteflow/shared';
import { Types } from 'mongoose';
import { type Business, BusinessModel, CustomerModel, InvoiceModel, QuoteModel } from '../models';
import { type CustomerRecord, toCustomerDto } from '../serializers/customer.serializer';
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

/** Issued and not cancelled: what the business has billed. */
const BILLED_STATUSES: InvoiceStatus[] = ['sent', 'partially_paid', 'paid', 'overdue'];
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

      const [
        totalQuotes,
        pendingQuotes,
        acceptedQuotes,
        acceptedNotInvoiced,
        totalInvoiced,
        amountPaid,
        outstanding,
        overdueCount,
        overdueAmount,
        recentQuotes,
        recentInvoices,
        recentCustomers,
        upcomingInvoices,
        activity,
      ] = await Promise.all([
        QuoteModel.countDocuments({ businessId }),
        QuoteModel.countDocuments({
          businessId,
          status: { $in: ['sent', 'viewed'] },
          expiryDate: { $gte: startOfToday },
        }),
        QuoteModel.countDocuments({ businessId, status: 'accepted' }),
        QuoteModel.countDocuments({ businessId, status: 'accepted', invoiceId: null }),
        sumInvoices(billed, 'totals.total'),
        sumInvoices(billed, 'amountPaid'),
        sumInvoices(unpaid, 'balanceDue'),
        InvoiceModel.countDocuments(overdueInAnyCurrency),
        sumInvoices({ ...overdueInAnyCurrency, currency }, 'balanceDue'),
        QuoteModel.find({ businessId })
          .select(QUOTE_LIST_PROJECTION)
          .sort({ createdAt: -1, _id: -1 })
          .limit(LIST_SIZE)
          .lean<QuoteListRecord[]>(),
        InvoiceModel.find({ businessId })
          .select(INVOICE_LIST_PROJECTION)
          .sort({ createdAt: -1, _id: -1 })
          .limit(LIST_SIZE)
          .lean<InvoiceListRecord[]>(),
        CustomerModel.find({ businessId, archivedAt: null })
          .sort({ createdAt: -1, _id: -1 })
          .limit(LIST_SIZE)
          .lean<CustomerRecord[]>(),
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
          accepted: acceptedQuotes,
          acceptedNotInvoiced,
        },
        invoices: { totalInvoiced, amountPaid, outstanding, overdueCount, overdueAmount },
        activity,
        recentQuotes: recentQuotes.map((quote) => toQuoteListItemDto(quote, today)),
        recentInvoices: recentInvoices.map((invoice) => toInvoiceListItemDto(invoice, today)),
        recentCustomers: recentCustomers.map(toCustomerDto),
        upcomingInvoices: upcomingInvoices.map((invoice) => toInvoiceListItemDto(invoice, today)),
      };
    },
  };
}

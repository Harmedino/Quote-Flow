import type { CurrencyCode } from './constants/currencies';
import type { CustomerDto } from './customers';
import type { InvoiceListItemDto } from './invoices';
import type { QuoteListItemDto } from './quotes';

/** How many days the dashboard's activity chart covers, ending today. */
export const DASHBOARD_ACTIVITY_DAYS = 30;

export interface DashboardDayDto {
  /** A calendar date in the business's time zone, 'YYYY-MM-DD'. */
  date: string;
  /** Payments recorded with this payment date. */
  paid: number;
  /** Totals of the quotes issued on this date, drafts left out. */
  quoted: number;
}

/**
 *   GET /api/dashboard (bearer) → 200 DashboardDto
 *
 * Money totals cover documents in the business's current currency (minor units).
 */
export interface DashboardDto {
  currency: CurrencyCode;
  quotes: {
    total: number;
    /** Sent or viewed, not yet answered or expired. */
    pending: number;
    accepted: number;
    /** Accepted quotes not converted into an invoice yet. */
    acceptedNotInvoiced: number;
  };
  invoices: {
    /** Sum of totals of all invoices that are not drafts or cancelled. */
    totalInvoiced: number;
    amountPaid: number;
    outstanding: number;
    overdueCount: number;
    overdueAmount: number;
  };
  activity: {
    /** One entry per day for the last DASHBOARD_ACTIVITY_DAYS days, oldest first, ending today. */
    days: DashboardDayDto[];
    /** The same sums over the DASHBOARD_ACTIVITY_DAYS days before, for comparison. */
    previous: { paid: number; quoted: number };
  };
  recentQuotes: QuoteListItemDto[];
  recentInvoices: InvoiceListItemDto[];
  recentCustomers: CustomerDto[];
  /** Unpaid, non-draft invoices ordered by due date (soonest first, overdue included). */
  upcomingInvoices: InvoiceListItemDto[];
}

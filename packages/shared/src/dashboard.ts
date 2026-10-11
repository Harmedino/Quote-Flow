import type { CurrencyCode } from './constants/currencies';
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

/** One payment recorded, or one quote issued, within the activity period. */
export interface DashboardActivityEntryDto {
  /** A calendar date in the business's time zone, 'YYYY-MM-DD'. */
  date: string;
  amount: number;
  customerName: string;
}

/** A quote waiting for the customer's answer, with what it takes to follow it up on WhatsApp. */
export interface DashboardAwaitingQuoteDto extends QuoteListItemDto {
  publicToken: string;
  customerPhone: string | null;
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
    /** The pending quotes the customer has opened. */
    viewed: number;
    accepted: number;
    /** Accepted quotes not converted into an invoice yet. */
    acceptedNotInvoiced: number;
  };
  invoices: {
    /** How many invoices there are, in any status. */
    total: number;
    /** Sum of totals of all invoices that are not drafts or cancelled. */
    totalInvoiced: number;
    amountPaid: number;
    outstanding: number;
    /** How many invoices make up `outstanding`. */
    outstandingCount: number;
    overdueCount: number;
    overdueAmount: number;
  };
  customers: {
    /** Active (not archived) customers. */
    total: number;
  };
  activity: {
    /** One entry per day for the last DASHBOARD_ACTIVITY_DAYS days, oldest first, ending today. */
    days: DashboardDayDto[];
    /** The same sums over the DASHBOARD_ACTIVITY_DAYS days before, for comparison. */
    previous: { paid: number; quoted: number };
    /** What makes up `days`: each payment and each quote, oldest first. */
    entries: { paid: DashboardActivityEntryDto[]; quoted: DashboardActivityEntryDto[] };
  };
  /** Sent or viewed quotes that have not expired, the latest issued first. */
  awaitingQuotes: DashboardAwaitingQuoteDto[];
  /** Accepted quotes not converted into an invoice yet, the latest accepted first. */
  readyToInvoice: QuoteListItemDto[];
  /** Unpaid, non-draft invoices ordered by due date (soonest first, overdue included). */
  upcomingInvoices: InvoiceListItemDto[];
}

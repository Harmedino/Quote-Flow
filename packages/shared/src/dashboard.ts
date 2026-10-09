import type { CurrencyCode } from './constants/currencies';
import type { CustomerDto } from './customers';
import type { InvoiceListItemDto } from './invoices';
import type { QuoteListItemDto } from './quotes';

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
  };
  invoices: {
    /** Sum of totals of all invoices that are not drafts or cancelled. */
    totalInvoiced: number;
    amountPaid: number;
    outstanding: number;
    overdueCount: number;
    overdueAmount: number;
  };
  recentQuotes: QuoteListItemDto[];
  recentInvoices: InvoiceListItemDto[];
  recentCustomers: CustomerDto[];
  /** Unpaid, non-draft invoices ordered by due date (soonest first, overdue included). */
  upcomingInvoices: InvoiceListItemDto[];
}

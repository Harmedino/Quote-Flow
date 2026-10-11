import {
  type CurrencyCode,
  DASHBOARD_ACTIVITY_DAYS,
  type DashboardDto,
  addDaysToIsoDate,
  isoDateToUtcDate,
  utcDateToIsoDate,
} from '@quoteflow/shared';
import type { Types } from 'mongoose';
import { InvoiceModel, QuoteModel } from '../models';

type Activity = DashboardDto['activity'];
type Series = keyof Activity['previous'];

interface InvoicePayments {
  customer: { name: string };
  payments: { amount: number; paidAt: Date }[];
}

interface QuoteDay {
  customer: { name: string };
  issueDate: Date;
  totals: { total: number };
}

/**
 * Money received and value quoted per day over the last DASHBOARD_ACTIVITY_DAYS days, each
 * payment and quote behind them, and the same sums for the period before, in the business
 * currency.
 *
 * Payment and issue dates are calendar dates in the business's time zone stored as UTC midnight,
 * so a record's day is its UTC date. The rows are read with a tenant-scoped, date-bounded query
 * and bucketed here rather than grouped in the database: MongoDB-compatible stores (FerretDB)
 * evaluate only the first accumulator of a `$group`.
 */
export async function dashboardActivity(
  businessId: Types.ObjectId,
  currency: CurrencyCode,
  today: string,
): Promise<Activity> {
  const first = addDaysToIsoDate(today, 1 - DASHBOARD_ACTIVITY_DAYS);
  const previousFirst = addDaysToIsoDate(first, -DASHBOARD_ACTIVITY_DAYS);
  const since = isoDateToUtcDate(previousFirst);

  const [invoices, quotes] = await Promise.all([
    InvoiceModel.find({ businessId, currency, 'payments.paidAt': { $gte: since } })
      .select('customer.name payments.amount payments.paidAt')
      .lean<InvoicePayments[]>(),
    QuoteModel.find({ businessId, currency, status: { $ne: 'draft' }, issueDate: { $gte: since } })
      .select('customer.name issueDate totals.total')
      .lean<QuoteDay[]>(),
  ]);

  const days = Array.from({ length: DASHBOARD_ACTIVITY_DAYS }, (_, index) => ({
    date: addDaysToIsoDate(first, index),
    paid: 0,
    quoted: 0,
  }));
  const byDate = new Map(days.map((day) => [day.date, day]));
  const previous = { paid: 0, quoted: 0 };
  const entries: Activity['entries'] = { paid: [], quoted: [] };

  function add(date: Date, series: Series, amount: number, customerName: string) {
    const key = utcDateToIsoDate(date);
    const day = byDate.get(key);
    if (day) {
      day[series] += amount;
      entries[series].push({ date: key, amount, customerName });
    } else if (key >= previousFirst && key < first) {
      previous[series] += amount;
    }
  }

  for (const invoice of invoices) {
    for (const payment of invoice.payments) {
      add(payment.paidAt, 'paid', payment.amount, invoice.customer.name);
    }
  }
  for (const quote of quotes) {
    add(quote.issueDate, 'quoted', quote.totals.total, quote.customer.name);
  }

  // ISO dates sort as text; the sort is stable, so a day's entries keep the order they were read.
  for (const list of Object.values(entries)) list.sort((a, b) => a.date.localeCompare(b.date));
  return { days, previous, entries };
}

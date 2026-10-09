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

interface PaymentDates {
  payments: { amount: number; paidAt: Date }[];
}

interface QuoteDay {
  issueDate: Date;
  totals: { total: number };
}

/**
 * Money received and value quoted per day over the last DASHBOARD_ACTIVITY_DAYS days, and the
 * same sums for the period before, in the business currency.
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
      .select('payments.amount payments.paidAt')
      .lean<PaymentDates[]>(),
    QuoteModel.find({ businessId, currency, status: { $ne: 'draft' }, issueDate: { $gte: since } })
      .select('issueDate totals.total')
      .lean<QuoteDay[]>(),
  ]);

  const days = Array.from({ length: DASHBOARD_ACTIVITY_DAYS }, (_, index) => ({
    date: addDaysToIsoDate(first, index),
    paid: 0,
    quoted: 0,
  }));
  const byDate = new Map(days.map((day) => [day.date, day]));
  const previous = { paid: 0, quoted: 0 };

  function add(date: Date, field: 'paid' | 'quoted', amount: number) {
    const key = utcDateToIsoDate(date);
    const day = byDate.get(key);
    if (day) day[field] += amount;
    else if (key >= previousFirst && key < first) previous[field] += amount;
  }

  for (const invoice of invoices) {
    for (const payment of invoice.payments) add(payment.paidAt, 'paid', payment.amount);
  }
  for (const quote of quotes) add(quote.issueDate, 'quoted', quote.totals.total);

  return { days, previous };
}

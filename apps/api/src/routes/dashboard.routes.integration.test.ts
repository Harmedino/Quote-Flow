import {
  DASHBOARD_ACTIVITY_DAYS,
  type DashboardDto,
  addDaysToIsoDate,
  isoDateToUtcDate,
  todayInTimeZone,
} from '@quoteflow/shared';
import type { Express } from 'express';
import { Types } from 'mongoose';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { BusinessModel, CustomerModel, InvoiceModel, QuoteModel } from '../models';
import { type SignedInClient, bearer, createAuthTestApp, registerOwner } from '../test/auth';
import { TEST_DATABASE_URI, useTestDatabase } from '../test/database';
import { dataOf } from '../test/helpers';
import { invoiceInput, paymentInput, quoteInput } from '../test/model-fixtures';
import { generatePublicToken } from '../utils/tokens';

/** Each fixture item: 2.5 × 5,500 = 13,750 minor units. */
const TOTAL = 13_750;
const TIME_ZONE = 'Pacific/Kiritimati';

function dayFromToday(offset: number): Date {
  return isoDateToUtcDate(addDaysToIsoDate(todayInTimeZone(TIME_ZONE), offset));
}

function fixtures({ session }: SignedInClient) {
  const owner = { businessId: session.business.id, createdBy: session.user.id };
  let sequence = 0;
  const next = () => (sequence += 1);
  const base = { ...owner, issueDate: dayFromToday(-30) };
  return {
    quote: (overrides: Record<string, unknown>) =>
      QuoteModel.create(
        quoteInput({
          ...base,
          quoteNumber: `Q-${next()}`,
          publicToken: generatePublicToken(),
          ...overrides,
        }),
      ),
    invoice: (overrides: Record<string, unknown>) =>
      InvoiceModel.create(
        invoiceInput({
          ...base,
          currency: 'USD',
          invoiceNumber: `I-${next()}`,
          publicToken: generatePublicToken(),
          ...overrides,
        }),
      ),
    customer: (name: string, archivedAt: Date | null = null) =>
      CustomerModel.create({ businessId: owner.businessId, name, archivedAt }),
  };
}

const getDashboard = (app: Express, accessToken: string) =>
  request(app).get('/api/dashboard').set('Authorization', bearer(accessToken));

describe.skipIf(!TEST_DATABASE_URI)('dashboard routes (database)', () => {
  useTestDatabase();

  it('returns zeros and empty lists for a new business', async () => {
    const app = createAuthTestApp();
    const { session } = await registerOwner(app);

    const res = await getDashboard(app, session.accessToken);

    expect(res.status).toBe(200);
    expect(res.headers['cache-control']).toBe('no-store');
    const today = todayInTimeZone(session.business.timezone);
    expect(dataOf<DashboardDto>(res)).toEqual({
      currency: session.business.currency,
      quotes: { total: 0, pending: 0, accepted: 0, acceptedNotInvoiced: 0 },
      invoices: {
        totalInvoiced: 0,
        amountPaid: 0,
        outstanding: 0,
        overdueCount: 0,
        overdueAmount: 0,
      },
      activity: {
        days: Array.from({ length: DASHBOARD_ACTIVITY_DAYS }, (_, index) => ({
          date: addDaysToIsoDate(today, index + 1 - DASHBOARD_ACTIVITY_DAYS),
          paid: 0,
          quoted: 0,
        })),
        previous: { paid: 0, quoted: 0 },
      },
      recentQuotes: [],
      recentInvoices: [],
      recentCustomers: [],
      upcomingInvoices: [],
    });
  });

  it('requires authentication', async () => {
    const res = await request(createAuthTestApp()).get('/api/dashboard');
    expect(res.status).toBe(401);
  });

  it('counts quotes with expiry evaluated in the business time zone', async () => {
    const app = createAuthTestApp();
    const owner = await registerOwner(app);
    await BusinessModel.updateOne(
      { _id: owner.session.business.id },
      { $set: { timezone: TIME_ZONE } },
    );
    const make = fixtures(owner);
    await make.quote({ status: 'sent', expiryDate: dayFromToday(0) }); // expires today: pending
    await make.quote({ status: 'viewed', expiryDate: dayFromToday(3) }); // pending
    await make.quote({ status: 'sent', expiryDate: dayFromToday(-1) }); // effectively expired
    await make.quote({ status: 'draft', expiryDate: dayFromToday(5) });
    await make.quote({ status: 'accepted', expiryDate: dayFromToday(-10) });
    // Already converted: accepted, but no longer waiting to be invoiced.
    await make.quote({
      status: 'accepted',
      expiryDate: dayFromToday(-10),
      invoiceId: new Types.ObjectId(),
    });

    const dashboard = dataOf<DashboardDto>(await getDashboard(app, owner.session.accessToken));

    expect(dashboard.quotes).toEqual({ total: 6, pending: 2, accepted: 2, acceptedNotInvoiced: 1 });
    expect(dashboard.recentQuotes).toHaveLength(5);
    expect(dashboard.recentQuotes[0]?.quoteNumber).toBe('Q-6');
    expect(dashboard.recentQuotes.find((q) => q.quoteNumber === 'Q-3')?.status).toBe('expired');
  });

  it('totals invoices in the business currency and applies the overdue rule', async () => {
    const app = createAuthTestApp();
    const owner = await registerOwner(app, { businessName: 'Ledger Co' });
    await BusinessModel.updateOne(
      { _id: owner.session.business.id },
      { $set: { timezone: TIME_ZONE, currency: 'USD' } },
    );
    const make = fixtures(owner);
    const paid = { amount: TOTAL };
    const partial = { amount: 3_750 };
    // Overdue: sent, past due, with a balance.
    await make.invoice({ status: 'sent', dueDate: dayFromToday(-2) });
    // Due today is not overdue yet.
    await make.invoice({
      status: 'partially_paid',
      dueDate: dayFromToday(0),
      payments: [paymentInput(partial)],
    });
    // Overdue and partially paid.
    await make.invoice({
      status: 'partially_paid',
      dueDate: dayFromToday(-1),
      payments: [paymentInput(partial)],
    });
    await make.invoice({
      status: 'paid',
      dueDate: dayFromToday(-5),
      payments: [paymentInput(paid)],
    });
    await make.invoice({ status: 'draft', dueDate: dayFromToday(-5) });
    await make.invoice({ status: 'cancelled', dueDate: dayFromToday(-5) });
    // Another currency: counted, but never added to USD totals.
    await make.invoice({ status: 'sent', currency: 'EUR', dueDate: dayFromToday(-3) });

    const dashboard = dataOf<DashboardDto>(await getDashboard(app, owner.session.accessToken));

    expect(dashboard.currency).toBe('USD');
    expect(dashboard.invoices).toEqual({
      totalInvoiced: 4 * TOTAL,
      amountPaid: TOTAL + 2 * 3_750,
      outstanding: TOTAL + 2 * (TOTAL - 3_750),
      overdueCount: 3,
      overdueAmount: TOTAL + (TOTAL - 3_750),
    });
    expect(dashboard.recentInvoices.map((i) => i.invoiceNumber)).toEqual([
      'I-7',
      'I-6',
      'I-5',
      'I-4',
      'I-3',
    ]);
    // Unpaid and issued, soonest due first.
    expect(dashboard.upcomingInvoices.map((i) => [i.invoiceNumber, i.status])).toEqual([
      ['I-7', 'overdue'],
      ['I-1', 'overdue'],
      ['I-3', 'overdue'],
      ['I-2', 'partially_paid'],
    ]);
  });

  it('adds up payments and quoted value per day in the business time zone', async () => {
    const app = createAuthTestApp();
    const owner = await registerOwner(app);
    await BusinessModel.updateOne(
      { _id: owner.session.business.id },
      { $set: { timezone: TIME_ZONE, currency: 'USD' } },
    );
    const make = fixtures(owner);
    const paidOn = (offset: number, amount: number) =>
      paymentInput({ amount, paidAt: dayFromToday(offset) });
    const billedLongAgo = {
      status: 'partially_paid',
      issueDate: dayFromToday(-90),
      dueDate: dayFromToday(5),
    };
    await make.invoice({
      ...billedLongAgo,
      payments: [paidOn(0, 100), paidOn(-29, 200), paidOn(-30, 400), paidOn(-59, 800)],
    });
    // Too old for either period.
    await make.invoice({
      ...billedLongAgo,
      payments: [paidOn(-60, 1_600)],
    });
    // Another currency is never added to USD money.
    await make.invoice({
      ...billedLongAgo,
      currency: 'EUR',
      dueDate: dayFromToday(5),
      payments: [paidOn(0, 3_200)],
    });
    await make.quote({ status: 'sent', issueDate: dayFromToday(0), expiryDate: dayFromToday(9) });
    await make.quote({
      status: 'viewed',
      issueDate: dayFromToday(-3),
      expiryDate: dayFromToday(9),
    });
    await make.quote({
      status: 'accepted',
      issueDate: dayFromToday(-45),
      expiryDate: dayFromToday(-30),
    });
    // Drafts have not been quoted to anyone yet.
    await make.quote({ status: 'draft', issueDate: dayFromToday(0), expiryDate: dayFromToday(9) });
    await make.quote({
      status: 'sent',
      currency: 'EUR',
      issueDate: dayFromToday(0),
      expiryDate: dayFromToday(9),
    });

    const { activity } = dataOf<DashboardDto>(await getDashboard(app, owner.session.accessToken));

    const date = (offset: number) => addDaysToIsoDate(todayInTimeZone(TIME_ZONE), offset);
    expect(activity.days).toHaveLength(DASHBOARD_ACTIVITY_DAYS);
    expect(activity.days[0]).toEqual({ date: date(-29), paid: 200, quoted: 0 });
    expect(activity.days.at(-1)).toEqual({ date: date(0), paid: 100, quoted: TOTAL });
    expect(activity.days.find((day) => day.date === date(-3))?.quoted).toBe(TOTAL);
    const sum = (field: 'paid' | 'quoted') =>
      activity.days.reduce((total, day) => total + day[field], 0);
    expect([sum('paid'), sum('quoted')]).toEqual([300, 2 * TOTAL]);
    expect(activity.previous).toEqual({ paid: 400 + 800, quoted: TOTAL });
  });

  it('lists the newest active customers only', async () => {
    const app = createAuthTestApp();
    const owner = await registerOwner(app);
    const make = fixtures(owner);
    for (const name of ['Ada', 'Bola', 'Chidi', 'Dayo', 'Efe', 'Femi']) await make.customer(name);
    await make.customer('Gone', new Date());

    const dashboard = dataOf<DashboardDto>(await getDashboard(app, owner.session.accessToken));

    expect(dashboard.recentCustomers.map((c) => c.name)).toEqual([
      'Femi',
      'Efe',
      'Dayo',
      'Chidi',
      'Bola',
    ]);
  });

  it("never includes another business's documents", async () => {
    const app = createAuthTestApp();
    const owner = await registerOwner(app);
    const other = await registerOwner(app);
    const make = fixtures(other);
    await make.quote({ status: 'sent', expiryDate: dayFromToday(10) });
    await make.invoice({
      status: 'partially_paid',
      currency: owner.session.business.currency,
      dueDate: dayFromToday(-1),
      payments: [paymentInput({ paidAt: dayFromToday(0) })],
    });
    await make.quote({
      status: 'sent',
      currency: owner.session.business.currency,
      issueDate: dayFromToday(0),
      expiryDate: dayFromToday(10),
    });
    await make.customer('Not yours');

    const dashboard = dataOf<DashboardDto>(await getDashboard(app, owner.session.accessToken));

    expect(dashboard.quotes.total).toBe(0);
    expect(dashboard.invoices.totalInvoiced).toBe(0);
    expect(dashboard.activity.previous).toEqual({ paid: 0, quoted: 0 });
    expect(dashboard.activity.days.every((day) => day.paid === 0 && day.quoted === 0)).toBe(true);
    expect(dashboard.recentQuotes).toEqual([]);
    expect(dashboard.recentInvoices).toEqual([]);
    expect(dashboard.recentCustomers).toEqual([]);
    expect(dashboard.upcomingInvoices).toEqual([]);
  });
});

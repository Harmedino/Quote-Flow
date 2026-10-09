import { type QuoteStatus, isoDateToUtcDate, todayInTimeZone } from '@quoteflow/shared';
import { type BusinessDocument, CustomerModel, QuoteModel } from '../models';
import { createSeedClock } from './clock';
import { DEMO_CUSTOMERS } from './data/customers';
import { OPEN_QUOTE_PLAN } from './data/documents';
import type { DemoAccount } from './demo-account';
import { savePlannedQuote } from './quotes';

/**
 * The quote the website opens for "Open a quote as the customer": one of the demo's quotes
 * that can still be accepted or declined. Visitors answer them, so once none is left a new
 * one is sent, the way the owner would send it.
 */

const ANSWERABLE: QuoteStatus[] = ['sent', 'viewed'];

/** The newest sent or viewed quote that hasn't expired, as the customer's page would judge it. */
async function findAnswerableQuote(business: BusinessDocument, now: Date) {
  const today = todayInTimeZone(business.timezone, now);
  return QuoteModel.findOne({
    businessId: business._id,
    status: { $in: ANSWERABLE },
    expiryDate: { $gte: isoDateToUtcDate(today) },
  })
    .sort({ issueDate: -1, _id: -1 })
    .select('publicToken')
    .lean();
}

/** The planned customer, or any other if a visitor has renamed that one. */
async function findCustomer(business: BusinessDocument) {
  const businessId = business._id;
  const planned = DEMO_CUSTOMERS[OPEN_QUOTE_PLAN.customer];
  const customer =
    (await CustomerModel.findOne({ businessId, name: planned.name })) ??
    (await CustomerModel.findOne({ businessId }).sort({ createdAt: -1 }));
  // Customers can be archived but never deleted, so the demo always has one.
  if (!customer) throw new Error('The demo business has no customers');
  return customer;
}

/** The public token of a demo quote its customer can still answer. */
export async function openDemoQuote({ business, user }: DemoAccount, now: Date): Promise<string> {
  const answerable = await findAnswerableQuote(business, now);
  if (answerable) return answerable.publicToken;

  const parties = {
    business,
    customer: await findCustomer(business),
    createdBy: user,
    items: OPEN_QUOTE_PLAN.items,
  };
  const quote = await savePlannedQuote(parties, createSeedClock(now), OPEN_QUOTE_PLAN);
  return quote.publicToken;
}

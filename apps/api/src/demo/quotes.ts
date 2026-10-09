import {
  type BusinessDocument,
  type CustomerDocument,
  type LineItem,
  QuoteModel,
  type Quote,
  type QuoteDocument,
  type UserDocument,
  toCustomerSnapshot,
} from '../models';
import { nextDocumentNumber } from '../services/numbering.service';
import { generatePublicToken } from '../utils/tokens';
import { QUOTE_PLANS, type QuotePlan } from './data/documents';
import { type SeedClock, addDays, addHours } from './clock';
import { buildLineItems } from './line-items';
import type { DemoTenant } from './tenant';

export interface SeededQuote {
  plan: QuotePlan;
  quote: QuoteDocument;
}

type QuoteEvents = Partial<
  Pick<Quote, 'sentAt' | 'viewedAt' | 'lastViewedAt' | 'acceptedAt' | 'rejectedAt'>
>;

function describe(plan: QuotePlan): string {
  return `${plan.status} quote for ${plan.customer} (${plan.daysAgo} days ago)`;
}

/** Catches plans whose dates contradict their status, e.g. an open quote that has already expired. */
function assertCoherent(plan: QuotePlan, expiryDate: Date, now: Date): void {
  const isOpen = plan.status === 'sent' || plan.status === 'viewed';
  if (isOpen && expiryDate <= now) throw new Error(`Seed plan: ${describe(plan)} has expired`);
  if (plan.status === 'expired' && expiryDate > now) {
    throw new Error(`Seed plan: ${describe(plan)} has not expired yet`);
  }
  if (plan.invoice && plan.status !== 'accepted') {
    throw new Error(`Seed plan: only accepted quotes can be converted (${describe(plan)})`);
  }
}

function quoteEvents(plan: QuotePlan, issueDate: Date, clock: SeedClock): QuoteEvents {
  if (plan.status === 'draft') return {};
  const sentAt = clock.notAfterNow(addHours(issueDate, 1));
  if (plan.status === 'sent' || plan.status === 'expired') return { sentAt };

  const viewedAt = clock.notAfterNow(addHours(sentAt, 5));
  const events: QuoteEvents = {
    sentAt,
    viewedAt,
    lastViewedAt: clock.notAfterNow(addDays(viewedAt, 1)),
  };
  if (plan.status === 'accepted') events.acceptedAt = clock.notAfterNow(addDays(issueDate, 2));
  if (plan.status === 'rejected') events.rejectedAt = clock.notAfterNow(addDays(issueDate, 3));
  return events;
}

/** The records a planned quote is built from: who it's from and for, and its items. */
export interface QuoteParties {
  business: BusinessDocument;
  customer: CustomerDocument;
  createdBy: UserDocument;
  items: Omit<LineItem, 'amount'>[];
}

/** Saves one planned quote, dated relative to the seed clock. */
export async function savePlannedQuote(
  { business, customer, createdBy, items }: QuoteParties,
  clock: SeedClock,
  plan: QuotePlan,
): Promise<QuoteDocument> {
  const issueDate = clock.daysAgo(plan.daysAgo);
  const expiryDate = addDays(issueDate, business.quoteValidityDays);
  assertCoherent(plan, expiryDate, clock.now);

  const quote = new QuoteModel({
    businessId: business._id,
    quoteNumber: await nextDocumentNumber(business._id, 'quote', business.quotePrefix),
    status: plan.status,
    customerId: customer._id,
    customer: toCustomerSnapshot(customer),
    currency: business.currency,
    items,
    discount: plan.discount ?? null,
    taxRate: business.defaultTaxRate,
    notes: business.defaultQuoteNotes,
    terms: business.defaultQuoteTerms,
    issueDate,
    expiryDate,
    publicToken: generatePublicToken(),
    createdBy: createdBy._id,
    createdAt: issueDate,
    rejectionReason: plan.rejectionReason,
    ...quoteEvents(plan, issueDate, clock),
  });
  return quote.save();
}

function createQuote(tenant: DemoTenant, clock: SeedClock, plan: QuotePlan) {
  const { business, users, customers, services } = tenant;
  const parties = {
    business,
    customer: customers[plan.customer],
    createdBy: users[plan.createdBy ?? 'owner'],
    items: buildLineItems(plan.items, services),
  };
  return savePlannedQuote(parties, clock, plan);
}

/** Creates the planned quotes oldest first, so their numbers follow their dates. */
export async function createQuotes(tenant: DemoTenant, clock: SeedClock): Promise<SeededQuote[]> {
  const plans = [...QUOTE_PLANS].sort((a, b) => b.daysAgo - a.daysAgo);
  const seeded: SeededQuote[] = [];
  for (const plan of plans) {
    seeded.push({ plan, quote: await createQuote(tenant, clock, plan) });
  }
  return seeded;
}

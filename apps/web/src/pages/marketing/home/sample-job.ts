import { buildQuoteShare } from '@/features/quotes/quote-share';
import type { SampleQuote } from '../solutions/trade-details';

/**
 * The job the home page follows from the first price to the last payment. It is website copy,
 * like the sample quotes on the Solutions page: a Lagos handyman business in lagoon teal.
 */
export const SAMPLE_BUSINESS = { name: 'Lagoon Home Services', brandColor: '#0f6b78' } as const;

/** The quote in the hero, accepted from the customer's phone. Its totals are worked out. */
export const SAMPLE_QUOTE: SampleQuote = {
  number: 'LHS-Q-0014',
  customer: 'Musa Ibrahim',
  lines: [
    { name: 'Handyman labour', quantity: 3, unit: 'h', rate: 6_000 },
    { name: 'Materials allowance', quantity: 1, rate: 25_000 },
  ],
  taxRate: 7.5,
};

/** When it was shared, opened and accepted. */
export const SAMPLE_TIMES = { day: 'Oct 5', sent: '10:31', viewed: '10:42', accepted: '10:47' };

/** An invoice with a deposit in, for the last step. */
export const SAMPLE_INVOICE = {
  number: 'LHS-INV-0007',
  customer: 'Adaeze O.',
  total: 129_000,
  paid: 51_600,
  payment: 'Transfer · Oct 2',
};

/** Services as they sit in the price list, for the first step. */
export const SAMPLE_SERVICES = [
  { name: 'Handyman labour', rate: 6_000, unit: 'h', picked: true },
  { name: 'AC servicing', rate: 15_000, unit: 'unit', picked: false },
  { name: 'Interior painting', rate: 2_500, unit: 'm²', picked: false },
] as const;

/** A link token is 43 random characters; the illustrations only ever show its start. */
const SAMPLE_TOKEN = '7kx2pmQ4vR9wLc3TzB8yHn5dKe1XoA6sJf0GuNh2Ybc';

/** The quote's WhatsApp message and link, written by the same code as a real share. */
export function sampleShare() {
  return buildQuoteShare({
    origin: window.location.origin,
    publicToken: SAMPLE_TOKEN,
    quoteNumber: SAMPLE_QUOTE.number,
    businessName: SAMPLE_BUSINESS.name,
    customerName: SAMPLE_QUOTE.customer,
    customerPhone: null,
  });
}

/** A link as the app shows it, without the scheme. */
export const displayUrl = (url: string) => url.replace(/^https?:\/\//, '');

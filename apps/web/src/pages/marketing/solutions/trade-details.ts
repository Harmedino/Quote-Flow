import type { DocumentDiscount } from '@quoteflow/shared';
import type { TradeId } from '@/components/marketing/trades';

/** One line of an illustrative quote. Rates are whole naira. */
export interface SampleLine {
  name: string;
  quantity: number;
  /** Written to follow the quantity, e.g. "sq m" or "guests". */
  unit?: string;
  rate: number;
}

/** A quote written for the website, to show what a trade's quotes look like in QuoteFlow. */
export interface SampleQuote {
  number: string;
  customer: string;
  lines: SampleLine[];
  /** A fixed discount's value is in whole naira, like the rates. */
  discount?: DocumentDiscount;
  taxRate?: number;
}

export interface TradeDetails {
  /** What pricing a job looks like without QuoteFlow. */
  pain: string;
  quote: SampleQuote;
  wins: string[];
}

export const TRADE_DETAILS: Record<TradeId, TradeDetails> = {
  cleaning: {
    pain: 'Every flat is a different size, so every price starts a new conversation on WhatsApp.',
    quote: {
      number: 'QT-0031',
      customer: 'Adaeze Okonkwo, Lekki',
      lines: [
        { name: 'Deep cleaning, 3-bedroom flat', quantity: 1, rate: 95_000 },
        { name: 'Kitchen degrease, oven and hood', quantity: 1, rate: 25_000 },
        { name: 'Window cleaning, inside', quantity: 14, unit: 'windows', rate: 1_500 },
      ],
      discount: { type: 'percentage', value: 5 },
    },
    wins: [
      'Save each service and its price once, then add it with a tap',
      'Extras on their own lines, so the customer sees what they pay for',
      'Sent on WhatsApp before you leave the viewing',
    ],
  },
  'plumbing-electrical': {
    pain: 'You price it after the inspection, the customer will “get back to you”, and the paper estimate is gone by the time they do.',
    quote: {
      number: 'QT-0108',
      customer: 'Tunde Bakare, Surulere',
      lines: [
        { name: 'Inspection and fault finding', quantity: 1, rate: 15_000 },
        { name: 'Rewiring', quantity: 12, unit: 'points', rate: 6_500 },
        { name: '8-way distribution board, supplied and fitted', quantity: 1, rate: 65_000 },
      ],
    },
    wins: [
      'Labour and materials on separate lines',
      'See when the customer opens the quote',
      'An accepted quote becomes an invoice without retyping it',
    ],
  },
  'ac-solar': {
    pain: 'Big installs, where the customer compares three quotes and asks for a new figure twice.',
    quote: {
      number: 'QT-0047',
      customer: 'Dr Ngozi Eze, Gwarinpa',
      lines: [
        { name: '5kVA hybrid inverter', quantity: 1, rate: 1_150_000 },
        { name: '5kWh lithium battery', quantity: 1, rate: 1_650_000 },
        { name: '550W solar panels', quantity: 6, unit: 'panels', rate: 185_000 },
        { name: 'Installation, cabling and mounting', quantity: 1, rate: 250_000 },
      ],
      discount: { type: 'fixed', value: 60_000 },
    },
    wins: [
      'Change the quote and the customer’s link shows the new figure',
      'A fixed discount when you agree on a price',
      'Record the deposit and the balance as two payments',
    ],
  },
  'painting-carpentry': {
    pain: 'Measurements in a notebook, materials priced from memory, and a customer who wants the figure tonight.',
    quote: {
      number: 'QT-0215',
      customer: 'Funke Adeyemi, Ikeja',
      lines: [
        { name: 'Interior painting, emulsion', quantity: 240, unit: 'sq m', rate: 1_200 },
        { name: 'Wall screeding', quantity: 62.5, unit: 'sq m', rate: 1_500 },
        { name: 'Wardrobe doors, rehang and adjust', quantity: 3, unit: 'doors', rate: 12_000 },
      ],
    },
    wins: [
      'Quantities with decimals, like 62.5 sq m',
      'Your own units: sq m, coat, door, day',
      'Your notes and terms on the quote and its PDF',
    ],
  },
  'events-catering': {
    pain: 'Packages priced per head, extras added in the chat, and a deposit to chase before the day.',
    quote: {
      number: 'QT-0089',
      customer: 'Chiamaka Okafor, Victoria Island',
      lines: [
        { name: 'Jollof rice, chicken and salad', quantity: 150, unit: 'guests', rate: 6_500 },
        { name: 'Small chops', quantity: 150, unit: 'guests', rate: 2_500 },
        { name: 'Hall decoration and centrepieces', quantity: 1, rate: 450_000 },
        { name: 'Service staff', quantity: 8, unit: 'staff', rate: 15_000 },
      ],
      taxRate: 7.5,
    },
    wins: [
      'Priced per head: guests times the rate, worked out for you',
      'Record the deposit now and the balance after the event',
      'Unpaid balances stay on your dashboard until they’re settled',
    ],
  },
  'photography-makeup': {
    pain: 'Packages, travel and extra hours agreed in DMs, then a disagreement about what was included.',
    quote: {
      number: 'QT-0063',
      customer: 'Bisola Martins, Yaba',
      lines: [
        { name: 'Wedding day coverage, 10 hours', quantity: 1, rate: 450_000 },
        { name: 'Bridal makeup and gele', quantity: 1, rate: 85_000 },
        { name: 'Photo album, 30 pages', quantity: 1, rate: 180_000 },
        { name: 'Travel outside Lagos', quantity: 1, rate: 50_000 },
      ],
      discount: { type: 'percentage', value: 10 },
    },
    wins: [
      'Packages saved as services, with their price',
      'Terms on every quote: deposit, delivery time, travel',
      'The customer accepts with no account',
    ],
  },
};

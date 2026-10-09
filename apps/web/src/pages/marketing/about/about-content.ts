import { CURRENCY_CODES } from '@quoteflow/shared';
import type { Step } from '@/components/marketing/NumberedSteps';

export const SIDES: { who: string; lead: string; points: string[] }[] = [
  {
    who: 'Your customer',
    lead: 'No app, no account. They open your link and answer.',
    points: [
      'Opens your quote from a WhatsApp message, on any phone',
      'Sees your business name, contact details and colour',
      'Accepts, or declines and says why',
      'Downloads the quote or the invoice as a PDF',
      'Opens the invoice to see what’s paid and what’s still due',
    ],
  },
  {
    who: 'You, the owner',
    lead: 'Every price you’ve given and every naira you’re owed, in one place.',
    points: [
      'A quote builder with your services, discount, tax, notes and terms',
      'Each quote’s status: sent, viewed, accepted, declined or expired',
      'Invoices from accepted quotes, or written from scratch',
      'Part and full payments, balances and overdue invoices',
      'Customers with all their quotes and invoices',
      'A dashboard of what’s waiting and who still owes you',
    ],
  },
];

export const JOURNEY: Step[] = [
  {
    title: 'You price the job',
    body: 'On site or at your desk, from your saved services. Discount, tax, notes and terms included.',
  },
  {
    title: 'You share one link',
    body: 'On WhatsApp with the message written for you, or anywhere you can paste a link. Or download the PDF.',
  },
  {
    title: 'Your customer opens it',
    body: 'On their phone, with no app and no account. On your side, the quote now shows as viewed.',
  },
  {
    title: 'They answer',
    body: 'Accept or decline, with a reason if they like. An expired quote can’t be accepted; you can give it a new date and send it again.',
  },
  {
    title: 'You invoice the job',
    body: 'The accepted quote becomes an invoice with the same items and prices. That happens once per quote, so nothing is billed twice.',
  },
  {
    title: 'They pay you',
    body: 'Directly, the way they always do. You record each payment, in part or in full.',
  },
  {
    title: 'You see who still owes you',
    body: 'Balances, overdue invoices and quotes waiting for an answer, all on your dashboard.',
  },
];

/** Listed only when this deployment has the live demo. */
export const DEMO_ITEM = 'A one-click demo with sample data';

export const EVERYTHING: { group: string; items: string[] }[] = [
  {
    group: 'Quotes',
    items: [
      'A quote builder with live totals',
      'Items from your services, or one-off lines',
      'Percentage or fixed discounts, and tax',
      'Default notes, terms and expiry',
      'Drafts, duplicates and edits after sending',
      'PDF download',
    ],
  },
  {
    group: 'Sharing and the customer page',
    items: [
      'Share on WhatsApp with a ready message',
      'A private link for every quote and invoice',
      'Accept or decline with no account',
      'Your business details and colour on the page',
      'When each quote was viewed and answered',
    ],
  },
  {
    group: 'Invoices and payments',
    items: [
      'Convert an accepted quote, once',
      'Invoices written from scratch',
      'Part and full payments, by any method',
      'Balances and overdue tracking',
      'Invoice links and PDFs',
    ],
  },
  {
    group: 'Customers and services',
    items: [
      'A customer list you can search',
      'Every quote and invoice for each customer',
      'Services with prices and units',
      'Archiving without losing history',
    ],
  },
  {
    group: 'Your business',
    items: [
      'Your brand colour on quotes, invoices and PDFs',
      'Your own numbering prefixes',
      `Any of ${CURRENCY_CODES.length} currencies, any time zone`,
      'Owner and staff roles: only the owner changes business settings',
    ],
  },
  {
    group: 'Behind the scenes',
    items: [
      'Dark mode',
      'Works on any phone, nothing to install',
      DEMO_ITEM,
      'Passwords stored hashed, never in plain text',
    ],
  },
];

/** Exactly what isn't built, so nobody signs up expecting it. */
export const NOT_YET = [
  'Sending quotes or invoices by email',
  'Taking payments online, or payment links',
  'Uploading your logo',
  'Inviting staff to your account',
  'Resetting a forgotten password by email',
  'Notifications and reminders',
];

export const YOUR_DATA = [
  'Your customers, quotes and invoices belong to your business only. No other account can see them.',
  'Quote and invoice links are long and random, so they can’t be guessed. A customer sees only what you sent them.',
  'Only the owner can change business settings, and the server checks it, not just the screens.',
  'Passwords are stored hashed, never in plain text.',
];

import { CURRENCY_CODES, MAX_LINE_ITEMS } from '@quoteflow/shared';
import type { FaqEntry } from '@/components/marketing/Faq';

const COST: FaqEntry = {
  question: 'What does it cost?',
  answer:
    'Nothing while QuoteFlow is in early access. Every account gets every feature, and you don’t enter a card to sign up. There are no paid plans today, so there is nothing to upgrade to or cancel.',
};

const NO_ACCOUNT: FaqEntry = {
  question: 'Do my customers need an app or an account?',
  answer:
    'No. They open the link you send in any browser, read the quote, and accept or decline it. That’s all.',
};

const PAYMENTS: FaqEntry = {
  question: 'Can customers pay through QuoteFlow?',
  answer:
    'No. Your customer pays you the way they already do, by transfer, cash or card, and you record the payment on the invoice. QuoteFlow keeps the balance and shows what’s overdue.',
};

const SENDING: FaqEntry = {
  question: 'Does QuoteFlow send emails or reminders?',
  answer:
    'No. You share quotes and invoices yourself, on WhatsApp or by copying the link. Overdue invoices are marked in the app, so you can see who to follow up with.',
};

const CURRENCIES: FaqEntry = {
  question: 'Can I use a currency other than naira?',
  answer: `Yes. Choose from ${CURRENCY_CODES.length} currencies, including US dollars, pounds, euros, cedis, shillings and rand, and set your business’s time zone.`,
};

/** How it works: questions about using QuoteFlow day to day. */
export const HOW_IT_WORKS_FAQ: FaqEntry[] = [
  COST,
  NO_ACCOUNT,
  PAYMENTS,
  SENDING,
  {
    question: 'Can I change a quote after sending it?',
    answer:
      'Yes, until the customer answers. The link stays the same and shows the new version. An expired quote can be given a new date and sent again.',
  },
  {
    question: 'What happens when a customer accepts?',
    answer:
      'The quote is marked accepted, with the date and time. You can then turn it into an invoice in one click. Each quote can be invoiced only once, so nothing is billed twice.',
  },
  CURRENCIES,
];

/** Pricing: questions about cost and limits. */
export const PRICING_FAQ: FaqEntry[] = [
  {
    question: 'Is it really free?',
    answer:
      'Yes. While QuoteFlow is in early access every account gets every feature at no cost. There are no paid plans today.',
  },
  {
    question: 'Do I need a card to sign up?',
    answer: 'No. You sign up with your name, your business name, an email address and a password.',
  },
  {
    question: 'Is there a limit on quotes or invoices?',
    answer: `No. Make as many quotes, invoices and customers as you need. A single quote or invoice can have up to ${MAX_LINE_ITEMS} lines.`,
  },
  PAYMENTS,
  SENDING,
  CURRENCIES,
];

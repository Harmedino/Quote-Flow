import {
  CircleCheckBig,
  FileText,
  LayoutDashboard,
  type LucideIcon,
  MessageCircle,
  Receipt,
  Users,
} from 'lucide-react';
import { type AppScreen, SCREENS } from '@/components/marketing/screens';

export interface FeatureSection {
  /** The section's anchor, linked from the home page. */
  id: string;
  icon: LucideIcon;
  /** The label in the sticky section nav. */
  nav: string;
  eyebrow: string;
  title: string;
  body: string;
  points: string[];
  visual: AppScreen | readonly [AppScreen, AppScreen];
}

export const FEATURE_SECTIONS: FeatureSection[] = [
  {
    id: 'quotes',
    icon: FileText,
    nav: 'Quotes',
    eyebrow: 'Quote builder',
    title: 'A quote in a minute, from your phone or your laptop',
    body: 'Choose the customer, add items from your services list or type a one-off line, and set a discount and tax. The totals update as you type, in your currency.',
    points: [
      'Items from your saved services, or typed in for this job only',
      'A percentage or fixed discount, and the tax rate you charge',
      'Your usual notes, terms and expiry date filled in for you',
      'Save it as a draft and finish it later',
    ],
    visual: SCREENS.quoteEditor,
  },
  {
    id: 'sharing',
    icon: MessageCircle,
    nav: 'Sharing',
    eyebrow: 'WhatsApp and links',
    title: 'Send it where your customers already are',
    body: 'Every quote has its own private link. Share it on WhatsApp with the message written for you, paste it into any chat, or download the PDF.',
    points: [
      'Opens WhatsApp with the message and link ready to send',
      'A private link that works for this one quote only',
      'A PDF of the quote whenever you need one',
      'Preview the page your customer sees, without counting as their visit',
    ],
    visual: SCREENS.quoteDetail,
  },
  {
    id: 'customer-page',
    icon: CircleCheckBig,
    nav: 'Customer page',
    eyebrow: 'Your customer’s side',
    title: 'Your customer accepts with one tap',
    body: 'The link opens a clean page with your business name, contact details and colour. Your customer reads the quote and accepts or declines it, with no app to install and no account to create.',
    points: [
      'Accept, or decline with an optional reason',
      'You see when they first opened it and when they answered',
      'They can download the quote as a PDF',
      'An expired quote can’t be accepted by mistake',
    ],
    visual: [SCREENS.quoteMobile, SCREENS.quoteAcceptedMobile],
  },
  {
    id: 'invoices',
    icon: Receipt,
    nav: 'Invoices',
    eyebrow: 'Invoices and payments',
    title: 'From accepted quote to paid invoice',
    body: 'Turn an accepted quote into an invoice in one click, or write an invoice from scratch. Your customer pays you the way they always do; you record each payment, and QuoteFlow keeps the balance.',
    points: [
      'A quote becomes an invoice only once, so nothing is billed twice',
      'Part and full payments: cash, bank transfer, card, mobile money or cheque',
      'Invoices are marked overdue as soon as the due date passes',
      'A link and a PDF for every invoice, to share on WhatsApp',
    ],
    visual: SCREENS.invoiceDetail,
  },
  {
    id: 'customers',
    icon: Users,
    nav: 'Customers',
    eyebrow: 'Customers and services',
    title: 'Your customers and your price list, in one place',
    body: 'Keep every customer’s contact details next to all their quotes and invoices. Save the services you sell with a price and a unit, so you never type them again.',
    points: [
      'Every quote, invoice and open balance on the customer’s page',
      'Services priced per visit, per hour, per square metre or per head',
      'Search customers by name, phone, email or company',
      'Archive a customer or turn off a service without losing its history',
    ],
    visual: SCREENS.customerDetail,
  },
  {
    id: 'dashboard',
    icon: LayoutDashboard,
    nav: 'Dashboard',
    eyebrow: 'Dashboard',
    title: 'See what’s waiting, and on whom',
    body: 'Your dashboard shows the money still to collect, what’s overdue, the quotes waiting for an answer and the accepted ones you haven’t invoiced yet.',
    points: [
      'Outstanding and overdue amounts at a glance',
      'Money received and quotes sent over the last 30 days',
      'Unpaid invoices in due-date order, overdue ones first',
      'A short checklist to get a new business ready',
    ],
    visual: SCREENS.dashboard,
  },
];

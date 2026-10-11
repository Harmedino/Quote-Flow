import type { Theme } from '@/lib/theme';

/**
 * Screenshots of QuoteFlow itself (public/screens/), taken from the seeded demo. SCREENS.md
 * says how each one is captured (route, state, viewport); keep the two in step.
 */
export interface PhoneScreen {
  device: 'phone';
  src: string;
  /** The same screen in dark mode, for the website in dark mode. */
  srcDark?: string;
  alt: string;
}

export interface BrowserScreen {
  device: 'browser';
  src: string;
  /** The same screen in dark mode, for the website in dark mode. */
  srcDark?: string;
  alt: string;
  /** The text in the frame's address bar, e.g. "quotes". */
  path: string;
  /** The same screen on a phone, shown in its place on phones, where a desktop one is unreadable. */
  mobile?: PhoneScreen;
}

export type AppScreen = BrowserScreen | PhoneScreen;

/** Whether to show a screen's dark capture: in dark mode, when it has one. */
export function showsDarkCapture(screen: AppScreen, theme: Theme): boolean {
  return theme === 'dark' && screen.srcDark !== undefined;
}

const file = (name: string) => `/screens/${name}.webp`;

/**
 * 390x844 CSS pixels, captured at 2x (780x1688). The frame draws its own navy status bar above
 * the screenshot, so a screen may start with anything (the app's hazard tape, a business's band).
 * The owner's screens also come in dark (`<name>-dark.webp`); a customer's page is always light.
 */
const phone = (name: string, alt: string, { dark = false } = {}): PhoneScreen => ({
  device: 'phone',
  src: file(name),
  ...(dark && { srcDark: file(`${name}-dark`) }),
  alt,
});

/** 1440x900 CSS pixels, captured at 1.5x (2160x1350), in light and dark. */
const browser = (name: string, path: string, alt: string, mobile: PhoneScreen): BrowserScreen => ({
  device: 'browser',
  src: file(name),
  srcDark: file(`${name}-dark`),
  path,
  alt,
  mobile,
});

const quoteEditorMobile = phone(
  'quote-editor-mobile',
  'Building a quote on a phone: the customer, the first item and the running total',
  { dark: true },
);
const quoteShareMobile = phone(
  'quote-share-mobile',
  'A sent quote in QuoteFlow on a phone, with the button to share it on WhatsApp',
  { dark: true },
);
const dashboardMobile = phone('dashboard-mobile', 'The QuoteFlow dashboard on a phone', {
  dark: true,
});

export const SCREENS = {
  dashboard: browser(
    'dashboard',
    'dashboard',
    'The QuoteFlow dashboard: money still to collect, payments received in the last 30 days and the jobs that need attention',
    dashboardMobile,
  ),
  quoteEditor: browser(
    'quote-editor',
    'quotes',
    'The quote builder: a customer, line items from the services list, a discount, tax and live totals',
    quoteEditorMobile,
  ),
  quoteDetail: browser(
    'quote-detail',
    'quotes',
    'A sent quote with its total, its status and buttons to share it on WhatsApp or copy the link',
    quoteShareMobile,
  ),
  invoiceDetail: browser(
    'invoice-detail',
    'invoices',
    'An invoice with a part payment recorded, the balance still due and the list of payments',
    phone(
      'invoice-detail-mobile',
      'An invoice on a phone: the balance still due, how much is collected and Record payment',
      { dark: true },
    ),
  ),
  customerDetail: browser(
    'customer-detail',
    'customers',
    'A customer’s page with their figures, contact details, quotes and invoices',
    phone(
      'customer-detail-mobile',
      'A customer’s page on a phone: their quotes, invoices, anything overdue and how to reach them',
      { dark: true },
    ),
  ),
  quoteMobile: phone(
    'quote-mobile',
    'A quote as the customer sees it on their phone, with Accept and Decline buttons',
  ),
  quoteAcceptedMobile: phone(
    'quote-accepted-mobile',
    'The same quote on the customer’s phone after they accepted it',
  ),
  quoteShareMobile,
  quoteEditorMobile,
  invoiceMobile: phone(
    'invoice-mobile',
    'An invoice as the customer sees it on their phone, with the amount paid and the balance due',
  ),
  dashboardMobile,
} satisfies Record<string, AppScreen>;

/**
 * Screenshots of QuoteFlow itself (public/screens/), taken from the seeded demo. SCREENS.md
 * says how each one is captured (route, state, viewport); keep the two in step.
 */
export type AppScreen =
  | {
      device: 'browser';
      src: string;
      alt: string;
      /** The text in the frame's address bar, e.g. "quotes". */
      path: string;
    }
  | {
      device: 'phone';
      src: string;
      alt: string;
    };

/** 1440x900 CSS pixels, captured at 1.5x (2160x1350). */
const browser = (file: string, path: string, alt: string): AppScreen => ({
  device: 'browser',
  src: `/screens/${file}.webp`,
  path,
  alt,
});

/**
 * 390x844 CSS pixels, captured at 2x (780x1688). Every phone screen starts with ink (the app's
 * top bar, or the demo business's band on its customer pages), which the frame's notch matches.
 */
const phone = (file: string, alt: string): AppScreen => ({
  device: 'phone',
  src: `/screens/${file}.webp`,
  alt,
});

export const SCREENS = {
  dashboard: browser(
    'dashboard',
    'dashboard',
    'The QuoteFlow dashboard: money still to collect, quotes waiting for an answer and the latest quotes',
  ),
  quoteEditor: browser(
    'quote-editor',
    'quotes',
    'The quote builder: a customer, line items from the services list, a discount, tax and live totals',
  ),
  quoteDetail: browser(
    'quote-detail',
    'quotes',
    'A sent quote with its total, its status and buttons to share it on WhatsApp or copy the link',
  ),
  invoiceDetail: browser(
    'invoice-detail',
    'invoices',
    'An invoice with a part payment recorded, the balance still due and the list of payments',
  ),
  customerDetail: browser(
    'customer-detail',
    'customers',
    'A customer’s page with their contact details, quotes, invoices and open balance',
  ),
  quoteMobile: phone(
    'quote-mobile',
    'A quote as the customer sees it on their phone, with Accept and Decline buttons',
  ),
  quoteAcceptedMobile: phone(
    'quote-accepted-mobile',
    'The same quote on the customer’s phone after they accepted it',
  ),
  quoteShareMobile: phone(
    'quote-share-mobile',
    'A sent quote in QuoteFlow on a phone, with the button to share it on WhatsApp',
  ),
  quoteEditorMobile: phone(
    'quote-editor-mobile',
    'Building a quote on a phone: line items and the running total',
  ),
  invoiceMobile: phone(
    'invoice-mobile',
    'An invoice as the customer sees it on their phone, with the amount paid and the balance due',
  ),
  dashboardMobile: phone('dashboard-mobile', 'The QuoteFlow dashboard on a phone'),
} satisfies Record<string, AppScreen>;

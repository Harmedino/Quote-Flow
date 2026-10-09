const segment = (value: string): string => encodeURIComponent(value);

/** Query parameter marking the business's own preview of a public quote. */
export const PREVIEW_PARAM = 'preview';

/** Every in-app URL is built here so links never drift from the route table. */
export const paths = {
  home: '/',
  login: '/login',
  register: '/register',
  forgotPassword: '/forgot-password',

  dashboard: '/dashboard',
  customers: '/customers',
  customer: (customerId: string) => `/customers/${segment(customerId)}`,
  services: '/services',
  quotes: '/quotes',
  newQuote: '/quotes/new',
  quote: (quoteId: string) => `/quotes/${segment(quoteId)}`,
  editQuote: (quoteId: string) => `/quotes/${segment(quoteId)}/edit`,
  invoices: '/invoices',
  newInvoice: '/invoices/new',
  invoice: (invoiceId: string) => `/invoices/${segment(invoiceId)}`,
  editInvoice: (invoiceId: string) => `/invoices/${segment(invoiceId)}/edit`,
  settings: '/settings',
  businessSettings: '/settings/business',
  accountSettings: '/settings/account',

  publicQuote: (token: string) => `/quote/${segment(token)}`,
  /** The business's own look at a quote link; the API does not record it as the customer's view. */
  publicQuotePreview: (token: string) => `/quote/${segment(token)}?${PREVIEW_PARAM}=1`,
  publicInvoice: (token: string) => `/invoice/${segment(token)}`,
} as const;

/** Query parameter carrying the in-app path to return to after signing in. */
export const REDIRECT_TO_PARAM = 'redirectTo';

/** Adds the path to return to after signing in, e.g. `/login?redirectTo=%2Fquotes`. */
export function withRedirectTo(path: string, redirectTo: string | null | undefined): string {
  if (!redirectTo) {
    return path;
  }
  return `${path}?${new URLSearchParams({ [REDIRECT_TO_PARAM]: redirectTo }).toString()}`;
}

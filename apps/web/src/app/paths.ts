const segment = (value: string): string => encodeURIComponent(value);

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
  invoice: (invoiceId: string) => `/invoices/${segment(invoiceId)}`,
  settings: '/settings',
  businessSettings: '/settings/business',
  accountSettings: '/settings/account',

  publicQuote: (token: string) => `/quote/${segment(token)}`,
} as const;

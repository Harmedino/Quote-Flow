import type { Business, User } from '../../models';

/** Sign-ups may not use this domain, so only the demo builder creates its accounts. */
export const DEMO_EMAIL_DOMAIN = 'quoteflow.test';

/** The demo business is found (and replaced) through its owner's email on the reserved domain. */
export const DEMO_OWNER_EMAIL = `demo@${DEMO_EMAIL_DOMAIN}`;

/** Expects a normalised (trimmed, lower-case) email. */
export const isDemoEmail = (email: string) => email.endsWith(`@${DEMO_EMAIL_DOMAIN}`);

export const DEMO_BUSINESS = {
  name: 'Evergreen Home Services',
  email: 'hello@evergreen-home.test',
  phone: '+1 512-555-0142',
  website: 'https://evergreen-home.test',
  address: {
    line1: '2201 South Lamar Blvd',
    line2: 'Suite 140',
    city: 'Austin',
    state: 'TX',
    postalCode: '78704',
    country: 'United States',
  },
  currency: 'USD',
  timezone: 'America/Chicago',
  brandColor: '#15803d',
  quotePrefix: 'EHS-Q',
  invoicePrefix: 'EHS-INV',
  quoteValidityDays: 14,
  invoiceDueDays: 14,
  defaultTaxRate: 8.25,
  defaultQuoteNotes:
    'Thank you for considering Evergreen Home Services. All work is carried out by our own insured and background-checked team.',
  defaultQuoteTerms:
    'Prices include labour and standard materials unless stated otherwise. A 30% deposit secures your booking for projects over $1,000. This quote is valid until the expiry date shown.',
  defaultInvoiceNotes: 'Thank you for your business!',
  defaultInvoiceTerms:
    'Payment is due by the due date shown. We accept bank transfer, card and cash. Please include the invoice number as your payment reference.',
  isDemo: true,
} satisfies Omit<Business, 'createdAt' | 'updatedAt'>;

export type DemoUserRole = 'owner' | 'staff';

export const DEMO_USERS = {
  owner: { name: 'Maya Robinson', email: DEMO_OWNER_EMAIL, role: 'owner' },
  staff: { name: 'Luis Ortega', email: `staff@${DEMO_EMAIL_DOMAIN}`, role: 'staff' },
} as const satisfies Record<DemoUserRole, Pick<User, 'name' | 'email' | 'role'>>;

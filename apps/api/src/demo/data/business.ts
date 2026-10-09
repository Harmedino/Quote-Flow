import type { Business, User } from '../../models';

/** The demo business is found (and replaced) through its owner's email on a reserved domain. */
export const DEMO_OWNER_EMAIL = 'demo@quoteflow.test';

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
} satisfies Omit<Business, 'createdAt' | 'updatedAt'>;

export type DemoUserRole = 'owner' | 'staff';

export const DEMO_USERS = {
  owner: { name: 'Maya Robinson', email: DEMO_OWNER_EMAIL, role: 'owner' },
  staff: { name: 'Luis Ortega', email: 'staff@quoteflow.test', role: 'staff' },
} as const satisfies Record<DemoUserRole, Pick<User, 'name' | 'email' | 'role'>>;

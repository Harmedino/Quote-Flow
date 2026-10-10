import { DEFAULT_BRAND_COLOR } from '@quoteflow/shared';
import type { Business, User } from '../../models';

/** Sign-ups may not use this domain, so only the demo builder creates its accounts. */
export const DEMO_EMAIL_DOMAIN = 'quoteflow.test';

/** Demo visitors sign in as this owner; only a business marked as the demo is used. */
export const DEMO_OWNER_EMAIL = `demo@${DEMO_EMAIL_DOMAIN}`;

/** Expects a normalised (trimmed, lower-case) email. */
export const isDemoEmail = (email: string) => email.endsWith(`@${DEMO_EMAIL_DOMAIN}`);

export const DEMO_BUSINESS = {
  name: 'Lagoon Home Services',
  email: 'hello@lagoon-home.test',
  phone: '+234 803 555 0142',
  website: 'https://lagoon-home.test',
  address: {
    line1: '27 Adeola Odeku Street',
    city: 'Victoria Island',
    state: 'Lagos',
    country: 'Nigeria',
  },
  currency: 'NGN',
  timezone: 'Africa/Lagos',
  // The default colour, like a business that hasn't picked one yet.
  brandColor: DEFAULT_BRAND_COLOR,
  quotePrefix: 'LHS-Q',
  invoicePrefix: 'LHS-INV',
  quoteValidityDays: 14,
  invoiceDueDays: 14,
  defaultTaxRate: 7.5,
  defaultQuoteNotes:
    'Thank you for considering Lagoon Home Services. All work is done by our own trained and vetted team.',
  defaultQuoteTerms:
    'Prices include labour and standard materials unless stated otherwise. A 50% deposit secures your date for jobs over ₦500,000. This quote is valid until the expiry date shown.',
  defaultInvoiceNotes: 'Thank you for your business!',
  defaultInvoiceTerms:
    'Payment is due by the due date shown. We accept bank transfer, card and cash. Please use the invoice number as your transfer narration.',
  isDemo: true,
} satisfies Omit<Business, 'createdAt' | 'updatedAt'>;

export type DemoUserRole = 'owner' | 'staff';

export const DEMO_USERS = {
  owner: { name: 'Tolu Adebayo', email: DEMO_OWNER_EMAIL, role: 'owner' },
  staff: { name: 'Emeka Nwosu', email: `staff@${DEMO_EMAIL_DOMAIN}`, role: 'staff' },
} as const satisfies Record<DemoUserRole, Pick<User, 'name' | 'email' | 'role'>>;

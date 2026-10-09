import type { Customer } from '../../models';

export type CustomerSeed = Pick<
  Customer,
  'name' | 'email' | 'phone' | 'company' | 'address' | 'notes'
> & {
  /** Archived customers stay on their old documents but are hidden from new work. */
  archivedDaysAgo?: number;
};

const austin = (line1: string, postalCode: string) => ({
  line1,
  city: 'Austin',
  state: 'TX',
  postalCode,
  country: 'United States',
});

const customers = {
  harper: {
    name: 'Olivia Harper',
    email: 'olivia.harper@example.com',
    phone: '+1 512-555-0101',
    address: austin('4108 Avenue F', '78751'),
    notes: 'Prefers morning appointments. Two friendly dogs in the back yard.',
  },
  nguyen: {
    name: 'Daniel Nguyen',
    email: 'daniel.nguyen@example.net',
    phone: '+1 512-555-0102',
    address: austin('7605 Shoal Creek Blvd', '78757'),
  },
  brightpath: {
    name: 'Dr. Priya Raman',
    company: 'Brightpath Dental Studio',
    email: 'office@brightpath-dental.example',
    phone: '+1 512-555-0103',
    address: { ...austin('1500 W 34th St', '78703'), line2: 'Suite 200' },
    notes:
      'Commercial client. Work must be scheduled outside clinic hours (after 6pm or weekends).',
  },
  coleman: {
    name: 'Marcus Coleman',
    email: 'marcus.coleman@example.com',
    phone: '+1 512-555-0104',
    address: austin('2913 Cherry Lane', '78703'),
  },
  lakeside: {
    name: 'Rachel Kim',
    company: 'Lakeside Property Management',
    email: 'maintenance@lakeside-pm.example',
    phone: '+1 512-555-0105',
    address: { ...austin('600 Congress Ave', '78701'), line2: 'Floor 14' },
    notes: 'Manages 40+ rental units. Send invoices to the maintenance inbox; PO number required.',
  },
  alvarez: {
    name: 'Sofia Alvarez',
    email: 'sofia.alvarez@example.org',
    phone: '+1 512-555-0106',
    address: austin('5402 Woodrow Ave', '78756'),
  },
  bennett: {
    name: 'Thomas Bennett',
    phone: '+1 512-555-0107',
    address: austin('1810 Kenwood Ave', '78704'),
    notes: 'No email — call or text.',
  },
  greenleaf: {
    name: 'Hannah Moore',
    company: 'Greenleaf Café',
    email: 'hannah@greenleaf-cafe.example',
    phone: '+1 512-555-0108',
    address: austin('1100 E 6th St', '78702'),
  },
  patel: {
    name: 'Arjun Patel',
    email: 'arjun.patel@example.com',
    address: austin('3207 Bonnie Rd', '78703'),
  },
  okafor: {
    name: 'Grace Okafor',
    email: 'grace.okafor@example.net',
    phone: '+1 512-555-0110',
    address: austin('9100 Brodie Ln', '78748'),
  },
  summit: {
    name: 'Jason Reed',
    company: 'Summit Realty Group',
    email: 'jreed@summit-realty.example',
    phone: '+1 512-555-0111',
    address: austin('3800 N Lamar Blvd', '78756'),
  },
  walsh: {
    name: 'Emily Walsh',
    email: 'emily.walsh@example.org',
    phone: '+1 512-555-0112',
    notes: 'Moved out of the service area.',
    archivedDaysAgo: 20,
  },
} satisfies Record<string, CustomerSeed>;

export type DemoCustomerKey = keyof typeof customers;

export const DEMO_CUSTOMERS: Record<DemoCustomerKey, CustomerSeed> = customers;

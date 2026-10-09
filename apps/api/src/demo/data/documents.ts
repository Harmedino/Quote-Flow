import type { InvoiceStatus, PaymentMethod, QuoteStatus } from '@quoteflow/shared';
import type { Discount, Service } from '../../models';
import type { DemoUserRole } from './business';
import type { DemoCustomerKey } from './customers';
import { DEMO_SERVICES, type DemoServiceKey } from './services';

/** A one-off item typed straight onto the document. */
export interface TypedItemPlan {
  name: string;
  description?: string;
  unit?: string;
  unitPrice: number;
  quantity: number;
}

/** A catalogue service, or a one-off item typed straight onto the document. */
export type ItemPlan = { service: DemoServiceKey; quantity: number } | TypedItemPlan;

export interface PaymentPlan {
  method: PaymentMethod;
  daysAfterIssue: number;
  /** A fraction of the invoice total, or whatever balance remains. */
  share: number | 'balance';
  reference?: string;
}

export interface InvoicePlan {
  status: InvoiceStatus;
  payments?: PaymentPlan[];
}

interface DocumentPlan {
  customer: DemoCustomerKey;
  /** When the document was issued, relative to the time of seeding. */
  daysAgo: number;
  items: ItemPlan[];
  discount?: Discount;
  createdBy?: DemoUserRole;
}

export interface QuotePlan extends DocumentPlan {
  status: QuoteStatus;
  rejectionReason?: string;
  /** Accepted quotes only: the invoice the quote was converted into. */
  invoice?: InvoicePlan;
}

export type StandaloneInvoicePlan = DocumentPlan & InvoicePlan;

export const QUOTE_PLANS: QuotePlan[] = [
  {
    customer: 'palmView',
    daysAgo: 58,
    status: 'accepted',
    items: [
      { service: 'moveOutClean', quantity: 3 },
      { service: 'interiorPainting', quantity: 135 },
    ],
    discount: { type: 'percentage', value: 5 },
    invoice: {
      status: 'paid',
      payments: [
        { method: 'bank_transfer', daysAfterIssue: 2, share: 0.5, reference: 'PO-7781 deposit' },
        { method: 'bank_transfer', daysAfterIssue: 15, share: 'balance', reference: 'PO-7781' },
      ],
    },
  },
  {
    customer: 'yetunde',
    daysAgo: 55,
    status: 'expired',
    items: [{ service: 'deepClean', quantity: 6 }],
  },
  {
    customer: 'smileCare',
    daysAgo: 50,
    status: 'accepted',
    items: [
      { service: 'acService', quantity: 3 },
      { service: 'solarCleaning', quantity: 14 },
    ],
    invoice: { status: 'overdue' },
  },
  {
    customer: 'chinedu',
    daysAgo: 45,
    status: 'rejected',
    createdBy: 'staff',
    items: [
      { service: 'exteriorPainting', quantity: 195 },
      { name: 'Pressure wash before painting', unit: 'job', unitPrice: 4_500_000, quantity: 1 },
    ],
    rejectionReason: 'Went with a painter who could start next week.',
  },
  {
    customer: 'harbourPoint',
    daysAgo: 40,
    status: 'accepted',
    items: [
      { service: 'moveOutClean', quantity: 2 },
      { service: 'handyman', quantity: 5 },
    ],
    invoice: { status: 'cancelled' },
  },
  {
    customer: 'segun',
    daysAgo: 36,
    status: 'expired',
    items: [{ service: 'tankCleaning', quantity: 2 }],
  },
  {
    customer: 'ofadaCorner',
    daysAgo: 30,
    status: 'accepted',
    createdBy: 'staff',
    items: [
      { service: 'acCallOut', quantity: 1 },
      {
        name: 'Replace AC fan motor',
        description: 'Compatible replacement motor; includes removal and disposal of the old part.',
        unit: 'part',
        unitPrice: 6_500_000,
        quantity: 1,
      },
      { service: 'handyman', quantity: 2 },
    ],
    invoice: {
      status: 'paid',
      payments: [{ method: 'card', daysAfterIssue: 6, share: 'balance' }],
    },
  },
  {
    customer: 'bisi',
    daysAgo: 25,
    status: 'rejected',
    items: [{ service: 'interiorPainting', quantity: 58 }],
    rejectionReason: 'Decided to wait until after the rainy season.',
  },
  {
    customer: 'adaeze',
    daysAgo: 16,
    status: 'accepted',
    items: [
      { service: 'deepClean', quantity: 5 },
      { service: 'interiorPainting', quantity: 35 },
    ],
    discount: { type: 'fixed', value: 500_000 },
    invoice: {
      status: 'partially_paid',
      payments: [{ method: 'bank_transfer', daysAfterIssue: 1, share: 0.4, reference: 'Deposit' }],
    },
  },
  {
    customer: 'grace',
    daysAgo: 13,
    status: 'accepted',
    items: [{ service: 'acService', quantity: 2 }],
    invoice: { status: 'sent' },
  },
  {
    customer: 'tunde',
    daysAgo: 12,
    status: 'viewed',
    items: [
      { service: 'standardClean', quantity: 4 },
      { service: 'deepClean', quantity: 3.5 },
    ],
    discount: { type: 'percentage', value: 10 },
  },
  {
    customer: 'segun',
    daysAgo: 9,
    status: 'sent',
    createdBy: 'staff',
    items: [
      { service: 'tankCleaning', quantity: 2 },
      { service: 'handyman', quantity: 1.5 },
    ],
  },
  {
    customer: 'palmView',
    daysAgo: 6,
    status: 'accepted',
    items: [{ service: 'standardClean', quantity: 12 }],
    discount: { type: 'percentage', value: 7.5 },
  },
  {
    customer: 'musa',
    daysAgo: 4,
    status: 'viewed',
    items: [
      { service: 'handyman', quantity: 3 },
      { name: 'Materials allowance', unit: 'lot', unitPrice: 2_500_000, quantity: 1 },
    ],
  },
  {
    customer: 'ofadaCorner',
    daysAgo: 2,
    status: 'sent',
    items: [
      { service: 'exteriorPainting', quantity: 160 },
      { service: 'acService', quantity: 4 },
    ],
  },
  {
    customer: 'smileCare',
    daysAgo: 1,
    status: 'draft',
    items: [{ service: 'standardClean', quantity: 8 }],
    discount: { type: 'percentage', value: 10 },
  },
  {
    customer: 'chinedu',
    daysAgo: 0,
    status: 'draft',
    createdBy: 'staff',
    items: [
      { service: 'solarCleaning', quantity: 12 },
      { service: 'handyman', quantity: 1.5 },
    ],
  },
];

export const STANDALONE_INVOICE_PLANS: StandaloneInvoicePlan[] = [
  {
    customer: 'tunde',
    daysAgo: 35,
    status: 'overdue',
    items: [
      { service: 'acCallOut', quantity: 1 },
      { name: 'Gas refill (R410A)', unit: 'kg', unitPrice: 1_200_000, quantity: 3 },
    ],
    payments: [{ method: 'cash', daysAfterIssue: 0, share: 0.25 }],
  },
  {
    customer: 'musa',
    daysAgo: 18,
    status: 'paid',
    createdBy: 'staff',
    items: [
      { service: 'acCallOut', quantity: 1 },
      { name: 'Capacitor replacement', unit: 'part', unitPrice: 1_800_000, quantity: 1 },
    ],
    payments: [{ method: 'cash', daysAfterIssue: 0, share: 'balance' }],
  },
  {
    customer: 'bisi',
    daysAgo: 3,
    status: 'draft',
    items: [{ service: 'standardClean', quantity: 2 }],
  },
];

/** A catalogue service's name, unit and price typed onto a document as a one-off item. */
function typedIn(key: DemoServiceKey, quantity: number): TypedItemPlan {
  const service: Pick<Service, 'name' | 'description' | 'unit' | 'price'> = DEMO_SERVICES[key];
  const { name, description, unit, price } = service;
  return { name, description, unit, unitPrice: price, quantity };
}

/**
 * Sent when visitors have answered every open quote of the demo, so the website can always
 * open one as the customer (see open-quote.ts). Its items are typed in rather than taken from
 * the catalogue, which visitors may have changed since the demo was built.
 */
export const OPEN_QUOTE_PLAN: QuotePlan & { items: TypedItemPlan[] } = {
  customer: 'adaeze',
  daysAgo: 0,
  status: 'sent',
  items: [typedIn('deepClean', 4), typedIn('interiorPainting', 40), typedIn('handyman', 2)],
  discount: { type: 'percentage', value: 5 },
};

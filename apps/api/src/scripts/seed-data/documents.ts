import type { InvoiceStatus, PaymentMethod, QuoteStatus } from '@quoteflow/shared';
import type { Discount } from '../../models';
import type { DemoUserRole } from './business';
import type { DemoCustomerKey } from './customers';
import type { DemoServiceKey } from './services';

/** A catalogue service, or a one-off item typed straight onto the document. */
export type ItemPlan =
  | { service: DemoServiceKey; quantity: number }
  | { name: string; description?: string; unit?: string; unitPrice: number; quantity: number };

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
    customer: 'lakeside',
    daysAgo: 58,
    status: 'accepted',
    items: [
      { service: 'moveOutClean', quantity: 3 },
      { service: 'interiorPainting', quantity: 1450 },
    ],
    discount: { type: 'percentage', value: 5 },
    invoice: {
      status: 'paid',
      payments: [
        { method: 'bank_transfer', daysAfterIssue: 2, share: 0.3, reference: 'PO-7781 deposit' },
        { method: 'bank_transfer', daysAfterIssue: 15, share: 'balance', reference: 'PO-7781' },
      ],
    },
  },
  {
    customer: 'walsh',
    daysAgo: 55,
    status: 'expired',
    items: [{ service: 'deepClean', quantity: 6 }],
  },
  {
    customer: 'brightpath',
    daysAgo: 50,
    status: 'accepted',
    items: [
      { service: 'acTuneUp', quantity: 3 },
      { service: 'ductCleaning', quantity: 14 },
    ],
    invoice: { status: 'overdue' },
  },
  {
    customer: 'coleman',
    daysAgo: 45,
    status: 'rejected',
    createdBy: 'staff',
    items: [
      { service: 'exteriorPainting', quantity: 2100 },
      { name: 'Pressure wash before painting', unit: 'job', unitPrice: 35_000, quantity: 1 },
    ],
    rejectionReason: 'Went with a contractor who could start next week.',
  },
  {
    customer: 'summit',
    daysAgo: 40,
    status: 'accepted',
    items: [
      { service: 'moveOutClean', quantity: 2 },
      { service: 'handyman', quantity: 5 },
    ],
    invoice: { status: 'cancelled' },
  },
  {
    customer: 'patel',
    daysAgo: 36,
    status: 'expired',
    items: [{ service: 'gutterCleaning', quantity: 180 }],
  },
  {
    customer: 'greenleaf',
    daysAgo: 30,
    status: 'accepted',
    createdBy: 'staff',
    items: [
      { service: 'acCallOut', quantity: 1 },
      {
        name: 'Replace condenser fan motor',
        description: 'OEM-equivalent motor; includes removal and disposal of the old part.',
        unit: 'part',
        unitPrice: 42_500,
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
    customer: 'alvarez',
    daysAgo: 25,
    status: 'rejected',
    items: [{ service: 'interiorPainting', quantity: 620 }],
    rejectionReason: 'Decided to postpone the project until the spring.',
  },
  {
    customer: 'harper',
    daysAgo: 16,
    status: 'accepted',
    items: [
      { service: 'deepClean', quantity: 5 },
      { service: 'interiorPainting', quantity: 380 },
    ],
    discount: { type: 'fixed', value: 2_500 },
    invoice: {
      status: 'partially_paid',
      payments: [{ method: 'mobile_money', daysAfterIssue: 1, share: 0.4, reference: 'Deposit' }],
    },
  },
  {
    customer: 'okafor',
    daysAgo: 13,
    status: 'accepted',
    items: [{ service: 'acTuneUp', quantity: 2 }],
    invoice: { status: 'sent' },
  },
  {
    customer: 'nguyen',
    daysAgo: 12,
    status: 'viewed',
    items: [
      { service: 'standardClean', quantity: 4 },
      { service: 'deepClean', quantity: 3.5 },
    ],
    discount: { type: 'percentage', value: 10 },
  },
  {
    customer: 'patel',
    daysAgo: 9,
    status: 'sent',
    createdBy: 'staff',
    items: [
      { service: 'gutterCleaning', quantity: 180 },
      { service: 'handyman', quantity: 1.5 },
    ],
  },
  {
    customer: 'lakeside',
    daysAgo: 6,
    status: 'accepted',
    items: [{ service: 'standardClean', quantity: 12 }],
    discount: { type: 'percentage', value: 7.5 },
  },
  {
    customer: 'bennett',
    daysAgo: 4,
    status: 'viewed',
    items: [
      { service: 'handyman', quantity: 3 },
      { name: 'Materials allowance', unit: 'lot', unitPrice: 8_500, quantity: 1 },
    ],
  },
  {
    customer: 'greenleaf',
    daysAgo: 2,
    status: 'sent',
    items: [{ service: 'ductCleaning', quantity: 10 }],
  },
  {
    customer: 'brightpath',
    daysAgo: 1,
    status: 'draft',
    items: [{ service: 'standardClean', quantity: 8 }],
    discount: { type: 'percentage', value: 10 },
  },
  {
    customer: 'coleman',
    daysAgo: 0,
    status: 'draft',
    createdBy: 'staff',
    items: [
      { service: 'gutterCleaning', quantity: 140 },
      { service: 'handyman', quantity: 1.5 },
    ],
  },
];

export const STANDALONE_INVOICE_PLANS: StandaloneInvoicePlan[] = [
  {
    customer: 'nguyen',
    daysAgo: 35,
    status: 'overdue',
    items: [
      { service: 'acCallOut', quantity: 1 },
      { name: 'Refrigerant recharge (R-410A)', unit: 'lb', unitPrice: 9_500, quantity: 3 },
    ],
    payments: [{ method: 'cash', daysAfterIssue: 0, share: 0.25 }],
  },
  {
    customer: 'bennett',
    daysAgo: 18,
    status: 'paid',
    createdBy: 'staff',
    items: [
      { service: 'acCallOut', quantity: 1 },
      { name: 'Capacitor replacement', unit: 'part', unitPrice: 14_500, quantity: 1 },
    ],
    payments: [{ method: 'cash', daysAfterIssue: 0, share: 'balance' }],
  },
  {
    customer: 'alvarez',
    daysAgo: 3,
    status: 'draft',
    items: [{ service: 'standardClean', quantity: 2 }],
  },
];

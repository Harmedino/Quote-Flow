import { INVOICE_STATUSES, type InvoiceStatus, TEXT_LIMITS } from '@quoteflow/shared';
import { type HydratedDocument, type Model, Schema, type Types, model } from 'mongoose';
import { atomicUpdateGuard } from './plugins/atomic-update-guard';
import { serialization } from './plugins/serialization';
import { type TenantOwned, tenantGuard } from './plugins/tenant-guard';
import { type Payment, paymentSubschema } from './schemas/payment';
import {
  type SalesDocument,
  type SalesDocumentOverrides,
  applyDerivedTotals,
  salesDocumentFields,
} from './schemas/sales-document';
import type { Timestamps } from './types';
import { nonNegativeMinorUnits } from './validators';

export interface Invoice extends TenantOwned, SalesDocument, Timestamps {
  invoiceNumber: string;
  /** The quote this invoice was converted from. A quote converts into at most one invoice. */
  quoteId?: Types.ObjectId | null;
  /** 'overdue' is time-based like quote expiry; a later stage applies it lazily and with a job. */
  status: InvoiceStatus;
  payments: Payment[];
  /** Sum of payments, in minor units. Derived. */
  amountPaid: number;
  /** totals.total − amountPaid, in minor units. Derived; overpayment is a validation error. */
  balanceDue: number;
  dueDate: Date;
  paidAt?: Date;
  cancelledAt?: Date;
}

interface InvoiceOverrides extends SalesDocumentOverrides {
  payments: Types.DocumentArray<Payment>;
}

export type InvoiceDocument = HydratedDocument<Invoice, InvoiceOverrides>;
type InvoiceModelType = Model<Invoice, object, InvoiceOverrides>;

const derivedAmount = { type: Number, required: true, default: 0, validate: nonNegativeMinorUnits };

const invoiceSchema = new Schema<Invoice, InvoiceModelType>(
  {
    invoiceNumber: {
      type: String,
      required: true,
      trim: true,
      maxlength: TEXT_LIMITS.documentNumber,
      immutable: true,
    },
    // Immutable: clearing it would take the invoice out of the partial unique index below,
    // letting the quote be converted again.
    quoteId: { type: Schema.Types.ObjectId, ref: 'Quote', default: null, immutable: true },
    status: { type: String, enum: INVOICE_STATUSES, required: true, default: 'draft' },
    ...salesDocumentFields,
    payments: { type: [paymentSubschema], default: [] },
    amountPaid: derivedAmount,
    balanceDue: derivedAmount,
    dueDate: { type: Date, required: true },
    paidAt: { type: Date },
    cancelledAt: { type: Date },
  },
  // Concurrent saves of a stale copy fail with a VersionError, so two payments
  // recorded at once can never leave amountPaid out of step with payments.
  { timestamps: true, optimisticConcurrency: true },
);

invoiceSchema.plugin(tenantGuard);
invoiceSchema.plugin(atomicUpdateGuard);
invoiceSchema.plugin(serialization);

function applyPaymentTotals(invoice: InvoiceDocument): void {
  const amountPaid = invoice.payments.reduce((sum, payment) => sum + payment.amount, 0);
  invoice.amountPaid = amountPaid;

  const total = invoice.totals?.total;
  if (total == null) return;
  if (amountPaid > total) {
    invoice.invalidate('payments', 'Payments cannot exceed the invoice total');
    return;
  }
  invoice.balanceDue = total - amountPaid;
}

function checkStatusMatchesBalance(invoice: InvoiceDocument): void {
  if (invoice.status === 'paid' && invoice.balanceDue !== 0) {
    invoice.invalidate('status', 'An invoice with a balance due cannot be marked as paid');
  }
  if (
    invoice.status === 'partially_paid' &&
    (invoice.amountPaid === 0 || invoice.balanceDue === 0)
  ) {
    invoice.invalidate('status', 'A partially paid invoice needs a payment and a balance due');
  }
}

invoiceSchema.pre('validate', function (this: InvoiceDocument) {
  applyDerivedTotals(this);
  applyPaymentTotals(this);
  checkStatusMatchesBalance(this);
  if (this.issueDate && this.dueDate && this.dueDate < this.issueDate) {
    this.invalidate('dueDate', 'The due date cannot be before the issue date');
  }
});

invoiceSchema.index({ businessId: 1, invoiceNumber: 1 }, { unique: true });
invoiceSchema.index({ publicToken: 1 }, { unique: true });
// Partial, so invoices without a quote are not indexed; a quote can never be converted twice,
// even by concurrent requests.
invoiceSchema.index(
  { quoteId: 1 },
  { unique: true, partialFilterExpression: { quoteId: { $type: 'objectId' } } },
);
invoiceSchema.index({ businessId: 1, status: 1, dueDate: 1 });
invoiceSchema.index({ businessId: 1, customerId: 1, createdAt: -1 });
invoiceSchema.index({ businessId: 1, createdAt: -1 });

export const InvoiceModel = model<Invoice, InvoiceModelType>('Invoice', invoiceSchema);

import { QUOTE_STATUSES, type QuoteStatus, TEXT_LIMITS } from '@quoteflow/shared';
import { type HydratedDocument, type Model, Schema, type Types, model } from 'mongoose';
import { atomicUpdateGuard } from './plugins/atomic-update-guard';
import { serialization } from './plugins/serialization';
import { type TenantOwned, tenantGuard } from './plugins/tenant-guard';
import {
  type SalesDocument,
  type SalesDocumentOverrides,
  applyDerivedTotals,
  salesDocumentFields,
} from './schemas/sales-document';
import type { Timestamps } from './types';

export interface Quote extends TenantOwned, SalesDocument, Timestamps {
  quoteNumber: string;
  /**
   * 'expired' is a stored status, but expiry itself is time-based: a later
   * stage applies it lazily on read and with a scheduled job.
   */
  status: QuoteStatus;
  expiryDate: Date;
  /** First time the customer opened the public link. */
  viewedAt?: Date;
  lastViewedAt?: Date;
  acceptedAt?: Date;
  rejectedAt?: Date;
  rejectionReason?: string;
  /** Set when the quote is converted into an invoice. */
  invoiceId?: Types.ObjectId;
  convertedAt?: Date;
  /**
   * Bumped on every edit by the business, so a customer's answer only applies
   * to the content they saw. Missing on quotes created before it existed (revision 0).
   */
  revision?: number;
}

export type QuoteDocument = HydratedDocument<Quote, SalesDocumentOverrides>;
type QuoteModelType = Model<Quote, object, SalesDocumentOverrides>;

const quoteSchema = new Schema<Quote, QuoteModelType>(
  {
    quoteNumber: {
      type: String,
      required: true,
      trim: true,
      maxlength: TEXT_LIMITS.documentNumber,
      immutable: true,
    },
    status: { type: String, enum: QUOTE_STATUSES, required: true, default: 'draft' },
    ...salesDocumentFields,
    expiryDate: { type: Date, required: true },
    viewedAt: { type: Date },
    lastViewedAt: { type: Date },
    acceptedAt: { type: Date },
    rejectedAt: { type: Date },
    rejectionReason: { type: String, trim: true, maxlength: TEXT_LIMITS.rejectionReason },
    invoiceId: { type: Schema.Types.ObjectId, ref: 'Invoice' },
    convertedAt: { type: Date },
    revision: { type: Number, default: 0, min: 0 },
  },
  // Concurrent saves of a stale copy fail with a VersionError instead of overwriting derived fields.
  { timestamps: true, optimisticConcurrency: true },
);

quoteSchema.plugin(tenantGuard);
quoteSchema.plugin(atomicUpdateGuard);
quoteSchema.plugin(serialization);

quoteSchema.pre('validate', function (this: QuoteDocument) {
  applyDerivedTotals(this);
  if (this.issueDate && this.expiryDate && this.expiryDate < this.issueDate) {
    this.invalidate('expiryDate', 'The expiry date cannot be before the issue date');
  }
});

quoteSchema.index({ businessId: 1, quoteNumber: 1 }, { unique: true });
quoteSchema.index({ publicToken: 1 }, { unique: true });
quoteSchema.index({ businessId: 1, status: 1, createdAt: -1 });
quoteSchema.index({ businessId: 1, customerId: 1, createdAt: -1 });
quoteSchema.index({ businessId: 1, createdAt: -1 });
quoteSchema.index({ businessId: 1, expiryDate: 1 });

export const QuoteModel = model<Quote, QuoteModelType>('Quote', quoteSchema);

import { TEXT_LIMITS } from '@quoteflow/shared';
import { type HydratedDocument, Schema, model } from 'mongoose';
import { serialization } from './plugins/serialization';
import { type TenantOwned, tenantGuard } from './plugins/tenant-guard';
import { type CustomerContact, customerContactFields } from './schemas/customer-snapshot';
import type { Timestamps } from './types';

/**
 * A customer of a business. Customers referenced by quotes or invoices are
 * archived (`archivedAt`) rather than deleted.
 */
export interface Customer extends TenantOwned, CustomerContact, Timestamps {
  notes?: string;
  archivedAt?: Date | null;
}

export type CustomerDocument = HydratedDocument<Customer>;

const customerSchema = new Schema<Customer>(
  {
    ...customerContactFields,
    notes: { type: String, trim: true, maxlength: TEXT_LIMITS.notes },
    archivedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

customerSchema.plugin(tenantGuard);
customerSchema.plugin(serialization);

customerSchema.index({ businessId: 1, name: 1 });
customerSchema.index({ businessId: 1, createdAt: -1 });
customerSchema.index({ businessId: 1, email: 1 });

export const CustomerModel = model<Customer>('Customer', customerSchema);

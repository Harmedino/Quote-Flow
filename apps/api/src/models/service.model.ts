import { lineItemInputSchema } from '@quoteflow/shared';
import { type HydratedDocument, Schema, model } from 'mongoose';
import { serialization } from './plugins/serialization';
import { type TenantOwned, tenantGuard } from './plugins/tenant-guard';
import type { Timestamps } from './types';
import { validateWith } from './validators';

/**
 * An entry in a business's catalogue. Adding it to a quote copies its name,
 * description, unit and price onto the line item, so the line-item rules apply.
 */
export interface Service extends TenantOwned, Timestamps {
  name: string;
  description?: string;
  /** Price per unit in minor units. */
  price: number;
  /** Free text such as "hour", "visit" or "m²". */
  unit?: string;
  /** Inactive services stay on existing documents but are not offered for new ones. */
  active: boolean;
}

export type ServiceDocument = HydratedDocument<Service>;

const rules = lineItemInputSchema.shape;

const serviceSchema = new Schema<Service>(
  {
    name: { type: String, required: true, trim: true, validate: validateWith(rules.name) },
    description: { type: String, trim: true, validate: validateWith(rules.description) },
    price: { type: Number, required: true, validate: validateWith(rules.unitPrice) },
    unit: { type: String, trim: true, validate: validateWith(rules.unit) },
    active: { type: Boolean, required: true, default: true },
  },
  { timestamps: true },
);

serviceSchema.plugin(tenantGuard);
serviceSchema.plugin(serialization);

serviceSchema.index({ businessId: 1, active: 1, name: 1 });

export const ServiceModel = model<Service>('Service', serviceSchema);

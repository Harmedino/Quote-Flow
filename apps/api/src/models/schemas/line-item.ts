import { lineItemInputSchema } from '@quoteflow/shared';
import { Schema, type Types } from 'mongoose';
import { nonNegativeMinorUnits, validateWith } from '../validators';

/**
 * A priced line on a quote or invoice. Name, unit and price are copied from
 * the service when the item is added, so later catalogue changes never alter
 * an existing document.
 */
export interface LineItem {
  serviceId?: Types.ObjectId;
  name: string;
  description?: string;
  quantity: number;
  unit?: string;
  /** Price per unit in minor units. */
  unitPrice: number;
  /** quantity × unitPrice in minor units. Derived: recalculated before every validation. */
  amount: number;
}

const rules = lineItemInputSchema.shape;

export const lineItemSubschema = new Schema<LineItem>(
  {
    serviceId: { type: Schema.Types.ObjectId, ref: 'Service' },
    name: { type: String, required: true, trim: true, validate: validateWith(rules.name) },
    description: { type: String, trim: true, validate: validateWith(rules.description) },
    quantity: { type: Number, required: true, validate: validateWith(rules.quantity) },
    unit: { type: String, trim: true, validate: validateWith(rules.unit) },
    unitPrice: { type: Number, required: true, validate: validateWith(rules.unitPrice) },
    amount: { type: Number, required: true, validate: nonNegativeMinorUnits },
  },
  { _id: false, id: false },
);

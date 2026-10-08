import { addressSchema as addressInputSchema } from '@quoteflow/shared';
import { Schema } from 'mongoose';
import { validateWith } from '../validators';

export interface Address {
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}

const rules = addressInputSchema.shape;

export const addressSubschema = new Schema<Address>(
  {
    line1: { type: String, trim: true, validate: validateWith(rules.line1) },
    line2: { type: String, trim: true, validate: validateWith(rules.line2) },
    city: { type: String, trim: true, validate: validateWith(rules.city) },
    state: { type: String, trim: true, validate: validateWith(rules.state) },
    postalCode: { type: String, trim: true, validate: validateWith(rules.postalCode) },
    country: { type: String, trim: true, validate: validateWith(rules.country) },
  },
  { _id: false, id: false },
);

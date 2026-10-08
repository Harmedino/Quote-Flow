import {
  DISCOUNT_TYPES,
  type DiscountType,
  moneySchema,
  percentageSchema,
} from '@quoteflow/shared';
import { type HydratedDocument, Schema } from 'mongoose';
// Must load before the schema below is declared (it imports nothing else that loads it).
import '../validator-messages';

export interface Discount {
  type: DiscountType;
  /** A percentage (0–100) for `percentage`, or an amount in minor units for `fixed`. */
  value: number;
}

const VALUE_RULES = { percentage: percentageSchema, fixed: moneySchema } as const;

export const discountSubschema = new Schema<Discount>(
  {
    type: { type: String, enum: DISCOUNT_TYPES, required: true },
    value: { type: Number, required: true },
  },
  { _id: false, id: false },
);

discountSubschema.pre('validate', function (this: HydratedDocument<Discount>) {
  // An unknown type is reported by the enum validator.
  if (!Object.hasOwn(VALUE_RULES, this.type) || this.value == null) return;
  const result = VALUE_RULES[this.type].safeParse(this.value);
  if (!result.success) {
    this.invalidate('value', result.error.issues[0]?.message ?? 'Invalid discount');
  }
});

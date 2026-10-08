import type { DocumentTotals } from '@quoteflow/shared';
import { Schema } from 'mongoose';
import { nonNegativeMinorUnits } from '../validators';

const amount = { type: Number, required: true, validate: nonNegativeMinorUnits };

/** Document totals in minor units. Derived from the items, discount and tax rate. */
export const totalsSubschema = new Schema<DocumentTotals>(
  { subtotal: amount, discount: amount, tax: amount, total: amount },
  { _id: false, id: false },
);

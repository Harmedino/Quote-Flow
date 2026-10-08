import { PAYMENT_METHODS, type PaymentMethod, TEXT_LIMITS, moneySchema } from '@quoteflow/shared';
import { Schema, type Types } from 'mongoose';
import { serialization } from '../plugins/serialization';
import { validateWith } from '../validators';

/** A payment recorded against an invoice. */
export interface Payment {
  _id: Types.ObjectId;
  /** Amount received in minor units. */
  amount: number;
  method: PaymentMethod;
  paidAt: Date;
  reference?: string;
  note?: string;
  recordedBy: Types.ObjectId;
  createdAt: Date;
}

const paymentAmountSchema = moneySchema.positive('A payment must be greater than zero');

export const paymentSubschema = new Schema<Payment>(
  {
    amount: { type: Number, required: true, validate: validateWith(paymentAmountSchema) },
    method: { type: String, enum: PAYMENT_METHODS, required: true },
    paidAt: { type: Date, required: true },
    reference: { type: String, trim: true, maxlength: TEXT_LIMITS.paymentReference },
    note: { type: String, trim: true, maxlength: TEXT_LIMITS.paymentNote },
    recordedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

paymentSubschema.plugin(serialization);

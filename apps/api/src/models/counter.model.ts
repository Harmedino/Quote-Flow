import { type HydratedDocument, Schema, model } from 'mongoose';
import { serialization } from './plugins/serialization';
import { type TenantOwned, tenantGuard } from './plugins/tenant-guard';
import type { Timestamps } from './types';
import { wholeNumber } from './validators';

export const DOCUMENT_KINDS = ['quote', 'invoice'] as const;
export type DocumentKind = (typeof DOCUMENT_KINDS)[number];

/** The last number issued for one kind of document in one business. */
export interface Counter extends TenantOwned, Timestamps {
  key: DocumentKind;
  seq: number;
}

export type CounterDocument = HydratedDocument<Counter>;

const counterSchema = new Schema<Counter>(
  {
    key: { type: String, enum: DOCUMENT_KINDS, required: true },
    seq: { type: Number, required: true, default: 0, min: 0, validate: wholeNumber },
  },
  { timestamps: true },
);

counterSchema.plugin(tenantGuard);
counterSchema.plugin(serialization);

counterSchema.index({ businessId: 1, key: 1 }, { unique: true });

export const CounterModel = model<Counter>('Counter', counterSchema);

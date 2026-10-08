import {
  CURRENCY_CODES,
  type CurrencyCode,
  type DocumentTotals,
  MAX_LINE_ITEMS,
  TEXT_LIMITS,
  calculateDocumentTotals,
  calculateLineAmount,
  percentageSchema,
} from '@quoteflow/shared';
import { type Document, Schema, type Types } from 'mongoose';
import { PUBLIC_TOKEN_PATTERN } from '../../utils/tokens';
import { validateWith } from '../validators';
import { type CustomerSnapshot, customerSnapshotSubschema } from './customer-snapshot';
import { type Discount, discountSubschema } from './discount';
import { type LineItem, lineItemSubschema } from './line-item';
import { totalsSubschema } from './totals';

/** What quotes and invoices have in common. */
export interface SalesDocument {
  customerId: Types.ObjectId;
  customer: CustomerSnapshot;
  /** The business currency when the document was created; all amounts are in its minor units. */
  currency: CurrencyCode;
  items: LineItem[];
  discount?: Discount | null;
  /** Tax rate as a percentage, applied after the discount. */
  taxRate: number;
  /** Derived from items, discount and taxRate before every validation. */
  totals: DocumentTotals;
  notes?: string;
  terms?: string;
  issueDate: Date;
  /** Capability token for the customer-facing link. */
  publicToken: string;
  sentAt?: Date;
  createdBy: Types.ObjectId;
}

/** Hydrated types of the embedded arrays, so items can be added without their derived amount. */
export interface SalesDocumentOverrides {
  items: Types.DocumentArray<LineItem>;
}

export const salesDocumentFields = {
  customerId: { type: Schema.Types.ObjectId, ref: 'Customer', required: true },
  customer: { type: customerSnapshotSubschema, required: true },
  currency: { type: String, enum: CURRENCY_CODES, required: true, immutable: true },
  items: {
    type: [lineItemSubschema],
    validate: [
      {
        validator: (items: readonly unknown[]) => items.length > 0,
        message: 'Add at least one item',
      },
      {
        validator: (items: readonly unknown[]) => items.length <= MAX_LINE_ITEMS,
        message: `A document can have at most ${MAX_LINE_ITEMS} items`,
      },
    ],
  },
  discount: { type: discountSubschema, default: null },
  taxRate: { type: Number, required: true, default: 0, validate: validateWith(percentageSchema) },
  totals: { type: totalsSubschema, required: true },
  notes: { type: String, trim: true, maxlength: TEXT_LIMITS.notes },
  terms: { type: String, trim: true, maxlength: TEXT_LIMITS.terms },
  issueDate: { type: Date, required: true },
  publicToken: { type: String, required: true, match: PUBLIC_TOKEN_PATTERN },
  sentAt: { type: Date },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true, immutable: true },
};

/**
 * Recalculates line amounts and totals with the shared calculations, so they
 * can never drift from the items or be supplied by a client. Runs in each
 * model's pre('validate') hook. Because of this, services must update quotes
 * and invoices with load-modify-save; plugins/atomic-update-guard.ts rejects
 * atomic updates unless they opt in and leave every derived input alone.
 */
export function applyDerivedTotals(document: SalesDocument & Document): void {
  try {
    for (const item of document.items) {
      item.amount = calculateLineAmount(item.quantity, item.unitPrice);
    }
    const { items, discount, taxRate } = document;
    document.totals = calculateDocumentTotals({ items, discount, taxRate });
  } catch (error) {
    // The calculations reject invalid input (most of which a field validator also reports)
    // and amounts beyond the safe integer range; either way the document must not be saved.
    if (!(error instanceof RangeError)) throw error;
    document.invalidate('totals', 'Totals could not be calculated from the items');
  }
}

import { type DiscountType, PERCENTAGE_DECIMALS, QUANTITY_DECIMALS } from './constants/documents';

export interface LineItemPricing {
  quantity: number;
  /** Price per unit in minor units. */
  unitPrice: number;
}

export interface DocumentDiscount {
  type: DiscountType;
  /** A percentage (0–100) for `percentage`, or an amount in minor units for `fixed`. */
  value: number;
}

export interface DocumentTotalsInput {
  items: readonly LineItemPricing[];
  discount?: DocumentDiscount | null;
  /** Tax rate as a percentage, e.g. 7.5 for 7.5%. */
  taxRate?: number | null;
}

/** All values are in minor units. */
export interface DocumentTotals {
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
}

const QUANTITY_SCALE = 10n ** BigInt(QUANTITY_DECIMALS);
const PERCENT_SCALE = 10n ** BigInt(PERCENTAGE_DECIMALS);
const HUNDRED_PERCENT = 100n * PERCENT_SCALE;

/** Integer division rounding half away from zero, for non-negative operands. */
function divideRoundHalfUp(numerator: bigint, denominator: bigint): bigint {
  return (numerator * 2n + denominator) / (denominator * 2n);
}

function toScaledInteger(value: number, scale: bigint): bigint {
  return BigInt(Math.round(value * Number(scale)));
}

function assertNonNegativeInteger(value: number, label: string): void {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new RangeError(`${label} must be a non-negative integer in minor units`);
  }
}

export function calculateLineAmount(quantity: number, unitPrice: number): number {
  if (!Number.isFinite(quantity) || quantity < 0) {
    throw new RangeError('Quantity must be a non-negative number');
  }
  assertNonNegativeInteger(unitPrice, 'Unit price');
  const amount = divideRoundHalfUp(
    toScaledInteger(quantity, QUANTITY_SCALE) * BigInt(unitPrice),
    QUANTITY_SCALE,
  );
  return Number(amount);
}

export function calculatePercentageOf(amount: number, percentage: number): number {
  assertNonNegativeInteger(amount, 'Amount');
  if (!Number.isFinite(percentage) || percentage < 0 || percentage > 100) {
    throw new RangeError('Percentage must be between 0 and 100');
  }
  return Number(
    divideRoundHalfUp(BigInt(amount) * toScaledInteger(percentage, PERCENT_SCALE), HUNDRED_PERCENT),
  );
}

/**
 * Calculates document totals. The API always recomputes totals with this
 * function and never trusts totals submitted by a client; the web app uses
 * the same function for live previews so both always agree.
 *
 * Order of operations: subtotal → discount → tax on the discounted amount.
 */
export function calculateDocumentTotals({
  items,
  discount,
  taxRate,
}: DocumentTotalsInput): DocumentTotals {
  const subtotal = items.reduce(
    (sum, item) => sum + calculateLineAmount(item.quantity, item.unitPrice),
    0,
  );

  let discountAmount = 0;
  if (discount && discount.value > 0) {
    if (discount.type === 'percentage') {
      discountAmount = calculatePercentageOf(subtotal, discount.value);
    } else {
      assertNonNegativeInteger(discount.value, 'Discount');
      discountAmount = Math.min(discount.value, subtotal);
    }
  }

  const taxableAmount = subtotal - discountAmount;
  const tax = taxRate ? calculatePercentageOf(taxableAmount, taxRate) : 0;

  return {
    subtotal,
    discount: discountAmount,
    tax,
    total: taxableAmount + tax,
  };
}

import type { CurrencyCode, DiscountInput } from '@quoteflow/shared';
import { discountLabel, formatPercent } from '@/components/documents/document-format';
import { formatMoney } from '@/lib/format';
import { draftTotals, type LineItemDraft } from './line-items';

export interface DocumentTotalsSummaryProps {
  items: LineItemDraft[];
  discount: DiscountInput | null;
  /** Percentage, e.g. 7.5. */
  taxRate: number;
  currency: CurrencyCode;
}

/** Live subtotal → discount → tax → total for a document being edited. */
export function DocumentTotalsSummary({
  items,
  discount,
  taxRate,
  currency,
}: DocumentTotalsSummaryProps) {
  const totals = draftTotals(items, discount, taxRate);
  if (!totals) {
    return (
      <p role="status" className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
        These amounts are too large to total. Check the quantities, prices, discount and tax rate.
      </p>
    );
  }
  const money = (amount: number) => formatMoney(amount, currency);

  return (
    <dl className="space-y-2.5 text-sm text-stone-600" aria-live="polite" aria-atomic="true">
      <div className="flex items-baseline justify-between gap-4">
        <dt>Subtotal</dt>
        <dd className="text-stone-900 tabular-nums">{money(totals.subtotal)}</dd>
      </div>
      {totals.discount > 0 && (
        <div className="flex items-baseline justify-between gap-4">
          <dt>{discountLabel(discount)}</dt>
          <dd className="text-stone-900 tabular-nums">−{money(totals.discount)}</dd>
        </div>
      )}
      {taxRate > 0 && (
        <div className="flex items-baseline justify-between gap-4">
          <dt>Tax ({formatPercent(taxRate)})</dt>
          <dd className="text-stone-900 tabular-nums">{money(totals.tax)}</dd>
        </div>
      )}
      <div className="flex items-baseline justify-between gap-4 border-t border-stone-200 pt-3">
        <dt className="font-semibold text-stone-900">Total</dt>
        <dd className="font-display text-2xl font-semibold tracking-tight text-stone-900 tabular-nums">
          {money(totals.total)}
        </dd>
      </div>
    </dl>
  );
}

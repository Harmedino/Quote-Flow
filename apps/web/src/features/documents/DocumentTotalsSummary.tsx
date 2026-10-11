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

function Line({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt>{label}</dt>
      <dd className="money text-sm font-medium text-ink">{value}</dd>
    </div>
  );
}

/** Live subtotal → discount → tax → total for a document being edited, set like a till slip. */
export function DocumentTotalsSummary({
  items,
  discount,
  taxRate,
  currency,
}: DocumentTotalsSummaryProps) {
  const totals = draftTotals(items, discount, taxRate);
  if (!totals) {
    return (
      <p role="status" className="rounded-lg bg-warning-tint px-3 py-2 text-sm text-warning">
        These amounts are too large to total. Check the quantities, prices, discount and tax rate.
      </p>
    );
  }
  const money = (amount: number) => formatMoney(amount, currency);

  return (
    <dl className="space-y-2 text-sm text-ink-2" aria-live="polite" aria-atomic="true">
      <Line label="Subtotal" value={money(totals.subtotal)} />
      {totals.discount > 0 && (
        <Line label={discountLabel(discount)} value={`−${money(totals.discount)}`} />
      )}
      {taxRate > 0 && <Line label={`Tax (${formatPercent(taxRate)})`} value={money(totals.tax)} />}
      <div className="flex items-baseline justify-between gap-4 border-t-[1.5px] border-dashed border-line-strong pt-2.5">
        <dt className="font-semibold text-ink">Total</dt>
        <dd className="money text-[15px] text-ink">{money(totals.total)}</dd>
      </div>
    </dl>
  );
}

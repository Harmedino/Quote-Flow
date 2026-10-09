import type { CurrencyCode, DiscountDto, TotalsDto } from '@quoteflow/shared';
import { cn } from '@/lib/cn';
import { formatMoney } from '@/lib/format';
import { discountLabel, formatPercent } from './document-format';

interface DocumentTotalsProps {
  currency: CurrencyCode;
  discount: DiscountDto;
  taxRate: number;
  totals: TotalsDto;
  amountPaid?: number;
  balanceDue?: number;
}

function Row({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className={cn('flex items-baseline justify-between gap-6', className)}>
      <dt>{label}</dt>
      <dd className="tabular-nums">{value}</dd>
    </div>
  );
}

function Highlight({
  label,
  value,
  className,
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex items-baseline justify-between gap-6 rounded-xl bg-(--doc-accent-soft) px-4 py-3.5 [print-color-adjust:exact]',
        className,
      )}
    >
      <dt className="font-semibold text-stone-900">{label}</dt>
      <dd className="font-display text-xl font-semibold tracking-tight text-(--doc-accent-text) tabular-nums sm:text-2xl">
        {value}
      </dd>
    </div>
  );
}

/**
 * Subtotal → discount → tax → total; for invoices the balance due is the highlighted figure.
 * Every line is a dt/dd pair directly inside the <dl> (no wrappers), so screen readers keep
 * each label with its amount.
 */
export function DocumentTotals({
  currency,
  discount,
  taxRate,
  totals,
  amountPaid,
  balanceDue,
}: DocumentTotalsProps) {
  const money = (amount: number) => formatMoney(amount, currency);
  const isInvoice = balanceDue !== undefined;

  const lines = [{ label: 'Subtotal', value: money(totals.subtotal) }];
  if (totals.discount > 0) {
    lines.push({ label: discountLabel(discount), value: `−${money(totals.discount)}` });
  }
  if (taxRate > 0 || totals.tax > 0) {
    lines.push({ label: `Tax (${formatPercent(taxRate)})`, value: money(totals.tax) });
  }

  return (
    <dl className="w-full space-y-3 text-sm text-stone-600 sm:max-w-sm">
      {lines.map((line, index) => (
        <Row
          key={line.label}
          {...line}
          // On a quote the rule sits between the breakdown and the highlighted total.
          className={
            !isInvoice && index === lines.length - 1 ? 'border-b border-stone-200 pb-3' : undefined
          }
        />
      ))}
      {isInvoice ? (
        <>
          <Row
            label="Total"
            value={money(totals.total)}
            className="border-t border-stone-200 pt-3 font-semibold text-stone-900"
          />
          {amountPaid !== undefined && (
            <Row label="Amount paid" value={amountPaid > 0 ? `−${money(amountPaid)}` : money(0)} />
          )}
          <Highlight label="Balance due" value={money(balanceDue)} className="mt-4" />
        </>
      ) : (
        <Highlight label="Total" value={money(totals.total)} />
      )}
    </dl>
  );
}

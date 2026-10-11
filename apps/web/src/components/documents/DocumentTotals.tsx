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
  /** The highlighted total's label when there is no balance due, e.g. "Total to pay" on a quote. */
  totalLabel?: string;
  /** Strikes through the highlighted figure, e.g. on a declined quote. */
  struck?: boolean;
  className?: string;
}

function Row({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className={cn('flex items-baseline justify-between gap-6', className)}>
      <dt>{label}</dt>
      <dd className="money text-sm font-medium text-ink">{value}</dd>
    </div>
  );
}

/** The figure that matters, in a sunken box with the business's colour underlining it. */
function Highlight({ label, value, struck }: { label: string; value: string; struck: boolean }) {
  return (
    <div className="mt-3.5 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 rounded-[10px] bg-surface-muted px-3.5 py-4 [print-color-adjust:exact]">
      <dt className="label-mono text-ink-2">{label}</dt>
      <dd
        className={cn(
          'text-2xl leading-none font-[820] tracking-[-0.02em] wrap-anywhere tabular-nums font-stretch-115% sm:text-[27px]',
          struck
            ? 'text-muted line-through decoration-declined decoration-2'
            : 'shadow-[inset_0_-5px_0_color-mix(in_srgb,var(--doc-accent)_30%,transparent)]',
        )}
      >
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
  totalLabel = 'Total',
  struck = false,
  className,
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
    <dl className={cn('space-y-2 text-sm text-ink-2', className)}>
      {lines.map((line) => (
        <Row key={line.label} {...line} />
      ))}
      {isInvoice ? (
        <>
          <Row
            label="Total"
            value={money(totals.total)}
            className="border-t-[1.5px] border-dashed border-line-strong pt-2.5 font-semibold text-ink"
          />
          {amountPaid !== undefined && (
            <Row label="Amount paid" value={amountPaid > 0 ? `−${money(amountPaid)}` : money(0)} />
          )}
          <Highlight label="Balance due" value={money(balanceDue)} struck={struck} />
        </>
      ) : (
        <Highlight label={totalLabel} value={money(totals.total)} struck={struck} />
      )}
    </dl>
  );
}

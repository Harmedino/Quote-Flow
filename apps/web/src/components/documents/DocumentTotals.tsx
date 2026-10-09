import type { CurrencyCode, DiscountDto, TotalsDto } from '@quoteflow/shared';
import type { ReactNode } from 'react';
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

function Row({ label, value, className }: { label: ReactNode; value: string; className?: string }) {
  return (
    <div className={cn('flex items-baseline justify-between gap-6', className)}>
      <dt>{label}</dt>
      <dd className="tabular-nums">{value}</dd>
    </div>
  );
}

function Highlight({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-6 rounded-xl bg-(--doc-accent-soft) px-4 py-3.5 [print-color-adjust:exact]">
      <dt className="font-semibold text-zinc-950">{label}</dt>
      <dd className="text-xl font-semibold tracking-tight text-(--doc-accent-text) tabular-nums sm:text-2xl">
        {value}
      </dd>
    </div>
  );
}

/** Subtotal → discount → tax → total; for invoices the balance due is the highlighted figure. */
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

  return (
    <dl className="w-full space-y-3 text-sm text-zinc-600 sm:max-w-sm">
      <Row label="Subtotal" value={money(totals.subtotal)} />
      {totals.discount > 0 && (
        <Row label={discountLabel(discount)} value={`−${money(totals.discount)}`} />
      )}
      {(taxRate > 0 || totals.tax > 0) && (
        <Row label={`Tax (${formatPercent(taxRate)})`} value={money(totals.tax)} />
      )}
      {isInvoice ? (
        <>
          <Row
            label="Total"
            value={money(totals.total)}
            className="border-t border-zinc-200 pt-3 font-semibold text-zinc-950"
          />
          {amountPaid !== undefined && (
            <Row label="Amount paid" value={amountPaid > 0 ? `−${money(amountPaid)}` : money(0)} />
          )}
          <div className="pt-1">
            <Highlight label="Balance due" value={money(balanceDue)} />
          </div>
        </>
      ) : (
        <div className="border-t border-zinc-200 pt-3">
          <Highlight label="Total" value={money(totals.total)} />
        </div>
      )}
    </dl>
  );
}

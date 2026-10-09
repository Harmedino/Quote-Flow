import type { PublicInvoiceDto } from '@quoteflow/shared';
import { cn } from '@/lib/cn';
import { formatCalendarDate, formatMoney } from '@/lib/format';
import { SummaryFigure } from './SummaryAside';
import { isAwaitingPayment } from './public-status';

type PublicInvoice = PublicInvoiceDto['invoice'];

function DueDate({ invoice, className }: { invoice: PublicInvoice; className?: string }) {
  const overdue = invoice.status === 'overdue';
  return (
    <p
      className={cn('text-sm font-medium', overdue ? 'text-red-700' : 'text-stone-700', className)}
    >
      {overdue ? 'Was due' : 'Due'} {formatCalendarDate(invoice.dueDate)}
    </p>
  );
}

function PaidProgress({ invoice }: { invoice: PublicInvoice }) {
  const { total } = invoice.totals;
  if (invoice.amountPaid <= 0) return null;
  const money = (amount: number) => formatMoney(amount, invoice.currency);
  const paidPercent = total > 0 ? Math.min(100, Math.round((invoice.amountPaid / total) * 100)) : 0;
  return (
    <div className="mt-5">
      <div aria-hidden="true" className="h-2 overflow-hidden rounded-full bg-stone-200">
        <div
          className="h-full animate-grow-width rounded-full bg-(--doc-fill)"
          style={{ width: `${paidPercent}%` }}
        />
      </div>
      <p className="mt-2 text-sm text-stone-600">
        {money(invoice.amountPaid)} of {money(total)} paid
      </p>
    </div>
  );
}

/**
 * The figure a customer opening an unpaid invoice is looking for, at a glance: below the wide
 * layout, where the summary beside the document shows it instead.
 */
export function AmountDueCard({ invoice }: { invoice: PublicInvoice }) {
  return (
    <section
      aria-label="Amount due"
      className="animate-fade-in-up rounded-3xl border border-stone-200 bg-surface p-5 sm:p-6 lg:hidden print:hidden"
    >
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-1">
        <div className="min-w-0">
          <p className="text-sm text-stone-500">Amount due</p>
          <p className="mt-1 font-display text-4xl font-semibold tracking-tight wrap-anywhere text-stone-900 tabular-nums">
            {formatMoney(invoice.balanceDue, invoice.currency)}
          </p>
        </div>
        <DueDate invoice={invoice} />
      </div>
      <PaidProgress invoice={invoice} />
    </section>
  );
}

/** The invoice's headline in the summary beside the document. */
export function InvoiceSummaryFigure({ invoice }: { invoice: PublicInvoice }) {
  if (isAwaitingPayment(invoice)) {
    return (
      <div>
        <SummaryFigure
          label="Amount due"
          amount={formatMoney(invoice.balanceDue, invoice.currency)}
        >
          <DueDate invoice={invoice} className="mt-1" />
        </SummaryFigure>
        <PaidProgress invoice={invoice} />
      </div>
    );
  }
  const note =
    invoice.status === 'paid'
      ? 'Paid in full'
      : invoice.status === 'cancelled'
        ? 'Cancelled: nothing to pay'
        : null;
  return (
    <SummaryFigure label="Total" amount={formatMoney(invoice.totals.total, invoice.currency)}>
      {note && <p className="mt-1 text-sm font-medium text-stone-700">{note}</p>}
    </SummaryFigure>
  );
}

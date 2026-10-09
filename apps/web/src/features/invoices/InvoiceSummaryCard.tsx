import type { InvoiceDto } from '@quoteflow/shared';
import { FileText } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { paths } from '@/app/paths';
import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/cn';
import { formatCalendarDate, formatDate, formatMoney } from '@/lib/format';

function Row({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex items-baseline justify-between gap-4', className)}>
      <dt className="text-zinc-600">{label}</dt>
      <dd className="text-right text-zinc-900 tabular-nums">{children}</dd>
    </div>
  );
}

function statusNote(invoice: InvoiceDto, timeZone: string): string | null {
  const when = (value: string) => formatDate(value, { timeZone });
  switch (invoice.status) {
    case 'draft':
      return 'Not sent yet. Mark it as sent or share it to start tracking payment.';
    case 'overdue':
      return `Payment was due on ${formatCalendarDate(invoice.dueDate)}.`;
    case 'paid':
      return invoice.paidAt
        ? `Paid in full on ${formatCalendarDate(invoice.paidAt.slice(0, 10))}.`
        : null;
    case 'cancelled':
      return invoice.cancelledAt ? `Cancelled on ${when(invoice.cancelledAt)}.` : null;
    default:
      return invoice.sentAt ? `Sent on ${when(invoice.sentAt)}.` : null;
  }
}

/** What is owed, the payment totals and where the invoice came from. */
export function InvoiceSummaryCard({
  invoice,
  timeZone,
}: {
  invoice: InvoiceDto;
  timeZone: string;
}) {
  const money = (amount: number) => formatMoney(amount, invoice.currency);
  const note = statusNote(invoice, timeZone);
  const outstanding = invoice.status !== 'cancelled' && invoice.balanceDue > 0;

  return (
    <Card className="space-y-5 p-5">
      <div>
        <div className="flex items-baseline justify-between gap-3 text-sm">
          <p className="font-semibold text-zinc-950">{outstanding ? 'Balance due' : 'Total'}</p>
          <p className="text-zinc-500">
            Due{' '}
            <span className={cn(invoice.status === 'overdue' && 'font-medium text-red-700')}>
              {formatCalendarDate(invoice.dueDate)}
            </span>
          </p>
        </div>
        <p
          className={cn(
            'mt-1 text-3xl font-semibold tracking-tight tabular-nums',
            invoice.status === 'overdue' ? 'text-red-700' : 'text-zinc-950',
          )}
        >
          {money(outstanding ? invoice.balanceDue : invoice.totals.total)}
        </p>
        {note && <p className="mt-1.5 text-sm text-pretty text-zinc-600">{note}</p>}
      </div>

      <dl className="space-y-2 border-t border-zinc-200 pt-4 text-sm">
        <Row label="Total">{money(invoice.totals.total)}</Row>
        <Row label="Paid">{money(invoice.amountPaid)}</Row>
        <Row label="Balance due" className="font-medium">
          {money(invoice.status === 'cancelled' ? 0 : invoice.balanceDue)}
        </Row>
      </dl>

      {invoice.quoteId && (
        <Link
          to={paths.quote(invoice.quoteId)}
          className="flex items-center gap-2 rounded-lg bg-zinc-50 px-3 py-2.5 text-sm font-medium text-zinc-700 ring-1 ring-zinc-200 transition-colors ring-inset hover:bg-zinc-100 hover:text-zinc-950"
        >
          <FileText aria-hidden="true" className="size-4 shrink-0 text-zinc-500" />
          View the original quote
        </Link>
      )}
    </Card>
  );
}

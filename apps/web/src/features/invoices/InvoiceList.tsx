import type { InvoiceListItemDto } from '@quoteflow/shared';
import { Link } from 'react-router';
import { paths } from '@/app/paths';
import { InvoiceStatusBadge } from '@/components/StatusBadge';
import { Skeleton } from '@/components/ui/Skeleton';
import { cn } from '@/lib/cn';
import { formatCalendarDate, formatMoney } from '@/lib/format';

function DueDate({ invoice }: { invoice: InvoiceListItemDto }) {
  const overdue = invoice.status === 'overdue';
  return (
    <span className={cn(overdue && 'font-medium text-red-700')}>
      {formatCalendarDate(invoice.dueDate)}
      {overdue && <span className="sr-only"> (overdue)</span>}
    </span>
  );
}

function hasBalance(invoice: InvoiceListItemDto): boolean {
  return invoice.balanceDue > 0 && invoice.status !== 'cancelled' && invoice.status !== 'draft';
}

const HEAD = 'px-4 py-3 text-left text-xs font-medium tracking-wide text-zinc-500 uppercase';
const CELL = 'px-4 py-3.5 text-sm whitespace-nowrap';

/** A table from `md` up and stacked rows below, inside the list card; each row links to the invoice. */
export function InvoiceList({ invoices }: { invoices: InvoiceListItemDto[] }) {
  return (
    <>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full">
          <thead className="border-b border-zinc-200 bg-zinc-50/80">
            <tr>
              <th scope="col" className={cn(HEAD, 'pl-6')}>
                Invoice
              </th>
              <th scope="col" className={HEAD}>
                Customer
              </th>
              <th scope="col" className={HEAD}>
                Issued
              </th>
              <th scope="col" className={HEAD}>
                Due
              </th>
              <th scope="col" className={HEAD}>
                Status
              </th>
              <th scope="col" className={cn(HEAD, 'text-right')}>
                Total
              </th>
              <th scope="col" className={cn(HEAD, 'pr-6 text-right')}>
                Balance due
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {invoices.map((invoice) => (
              <tr key={invoice.id} className="group relative transition-colors hover:bg-zinc-50">
                <td className={cn(CELL, 'pl-6 font-medium text-zinc-950')}>
                  <Link
                    to={paths.invoice(invoice.id)}
                    className="rounded-sm after:absolute after:inset-0 focus-visible:outline-2 focus-visible:outline-brand-600"
                  >
                    {invoice.invoiceNumber}
                  </Link>
                </td>
                <td className={cn(CELL, 'max-w-56 truncate text-zinc-700')}>
                  {invoice.customerName}
                </td>
                <td className={cn(CELL, 'text-zinc-600')}>
                  {formatCalendarDate(invoice.issueDate)}
                </td>
                <td className={cn(CELL, 'text-zinc-600')}>
                  <DueDate invoice={invoice} />
                </td>
                <td className={CELL}>
                  <InvoiceStatusBadge status={invoice.status} />
                </td>
                <td className={cn(CELL, 'text-right text-zinc-700 tabular-nums')}>
                  {formatMoney(invoice.total, invoice.currency)}
                </td>
                <td
                  className={cn(
                    CELL,
                    'pr-6 text-right tabular-nums',
                    hasBalance(invoice) ? 'font-medium text-zinc-950' : 'text-zinc-400',
                  )}
                >
                  {formatMoney(invoice.balanceDue, invoice.currency)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="divide-y divide-zinc-100 md:hidden">
        {invoices.map((invoice) => (
          <li key={invoice.id}>
            <Link
              to={paths.invoice(invoice.id)}
              className="block px-4 py-4 transition-colors hover:bg-zinc-50 focus-visible:bg-zinc-50 focus-visible:outline-offset-[-2px]"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-medium text-zinc-950">{invoice.customerName}</p>
                  <p className="mt-0.5 text-sm text-zinc-500">{invoice.invoiceNumber}</p>
                </div>
                <InvoiceStatusBadge status={invoice.status} />
              </div>
              <div className="mt-3 flex items-end justify-between gap-3 text-sm">
                <p className="text-zinc-600">
                  Due <DueDate invoice={invoice} />
                </p>
                <div className="text-right">
                  <p className="font-semibold text-zinc-950 tabular-nums">
                    {formatMoney(
                      hasBalance(invoice) ? invoice.balanceDue : invoice.total,
                      invoice.currency,
                    )}
                  </p>
                  <p className="text-xs text-zinc-500">
                    {hasBalance(invoice) && invoice.balanceDue !== invoice.total
                      ? `of ${formatMoney(invoice.total, invoice.currency)}`
                      : hasBalance(invoice)
                        ? 'Balance due'
                        : 'Total'}
                  </p>
                </div>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}

export function InvoiceListSkeleton() {
  return (
    <div role="status" aria-label="Loading invoices" className="divide-y divide-zinc-100">
      {Array.from({ length: 6 }, (_, index) => (
        <div key={index} className="flex items-center gap-4 px-4 py-4 md:px-6">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="hidden h-4 w-24 md:block" />
          <Skeleton className="hidden h-4 w-24 md:block" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
      ))}
    </div>
  );
}

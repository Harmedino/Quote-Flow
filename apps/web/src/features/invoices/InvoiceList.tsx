import type { InvoiceListItemDto } from '@quoteflow/shared';
import { Link } from 'react-router';
import { paths } from '@/app/paths';
import { InvoiceStatusAccent, InvoiceStatusBadge } from '@/components/StatusBadge';
import { Avatar } from '@/components/ui/Avatar';
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

const HEAD =
  'px-4 py-3 text-left text-xs font-medium tracking-wide whitespace-nowrap text-stone-500 uppercase';
const CELL = 'px-4 py-3 text-sm whitespace-nowrap';

/**
 * A table from `md` up and stacked rows below, inside the list panel; each row links to the
 * invoice, so the whole row opens it.
 */
export function InvoiceList({ invoices }: { invoices: InvoiceListItemDto[] }) {
  return (
    <>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full">
          <thead className="bg-surface-muted">
            <tr>
              <th scope="col" className={cn(HEAD, 'pl-5')}>
                Customer
              </th>
              <th scope="col" className={HEAD}>
                Invoice
              </th>
              {/* Left out on tablets, so the amounts fit without scrolling. */}
              <th scope="col" className={cn(HEAD, 'hidden lg:table-cell')}>
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
              <th scope="col" className={cn(HEAD, 'pr-5 text-right')}>
                Balance due
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {invoices.map((invoice) => (
              <tr
                key={invoice.id}
                className="relative transition-colors focus-within:bg-stone-50 hover:bg-stone-50"
              >
                <td className={cn(CELL, 'max-w-64 pl-5')}>
                  <div className="flex items-center gap-3">
                    <Avatar name={invoice.customerName} size="sm" />
                    <span className="truncate font-medium text-stone-900">
                      {invoice.customerName}
                    </span>
                  </div>
                </td>
                <td className={CELL}>
                  {/* The link covers the whole row, so any part of it opens the invoice. */}
                  <Link
                    to={paths.invoice(invoice.id)}
                    className="rounded-sm font-mono text-[13px] text-stone-600 after:absolute after:inset-0 hover:text-brand-700"
                  >
                    {invoice.invoiceNumber}
                  </Link>
                </td>
                <td className={cn(CELL, 'hidden text-stone-600 lg:table-cell')}>
                  {formatCalendarDate(invoice.issueDate)}
                </td>
                <td className={cn(CELL, 'text-stone-600')}>
                  <DueDate invoice={invoice} />
                </td>
                <td className={CELL}>
                  <InvoiceStatusBadge status={invoice.status} />
                </td>
                <td className={cn(CELL, 'text-right text-stone-600 tabular-nums')}>
                  {formatMoney(invoice.total, invoice.currency)}
                </td>
                <td
                  className={cn(
                    CELL,
                    'pr-5 text-right tabular-nums',
                    hasBalance(invoice) ? 'font-semibold text-stone-900' : 'text-stone-500',
                  )}
                >
                  {formatMoney(invoice.balanceDue, invoice.currency)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="divide-y divide-stone-100 md:hidden">
        {invoices.map((invoice) => (
          <li key={invoice.id}>
            <Link
              to={paths.invoice(invoice.id)}
              className="flex items-center gap-3 px-3.5 py-3 transition-colors hover:bg-stone-50 focus-visible:outline-offset-[-2px] active:bg-stone-100"
            >
              <InvoiceStatusAccent status={invoice.status} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-stone-900">
                  {invoice.customerName}
                </p>
                <p className="mt-0.5 text-xs text-stone-500">
                  {invoice.invoiceNumber} · Due <DueDate invoice={invoice} />
                </p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                <span className="text-right text-sm font-semibold text-stone-900 tabular-nums">
                  {formatMoney(
                    hasBalance(invoice) ? invoice.balanceDue : invoice.total,
                    invoice.currency,
                  )}
                  {hasBalance(invoice) && invoice.balanceDue !== invoice.total && (
                    <span className="block text-[11px] font-normal text-stone-500">
                      <span className="sr-only">due </span>of{' '}
                      {formatMoney(invoice.total, invoice.currency)}
                    </span>
                  )}
                </span>
                <InvoiceStatusBadge status={invoice.status} />
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
    <div role="status" aria-label="Loading invoices" className="divide-y divide-stone-100">
      {Array.from({ length: 6 }, (_, index) => (
        <div key={index} className="flex items-center gap-4 px-4 py-3.5 md:px-5">
          <Skeleton className="hidden size-8 rounded-full md:block" />
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="hidden h-4 w-24 md:block" />
          <Skeleton className="hidden h-4 w-24 md:block" />
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-4 w-20" />
        </div>
      ))}
    </div>
  );
}

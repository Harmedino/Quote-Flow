import type { InvoiceListItemDto } from '@quoteflow/shared';
import { Link } from 'react-router';
import { paths } from '@/app/paths';
import { InvoiceStatusBadge } from '@/components/StatusBadge';
import { Avatar } from '@/components/ui/Avatar';
import { MetaLine } from '@/components/ui/MetaLine';
import { Skeleton } from '@/components/ui/Skeleton';
import { cn } from '@/lib/cn';
import { formatCalendarDate, formatMoney } from '@/lib/format';

function DueDate({ invoice }: { invoice: InvoiceListItemDto }) {
  const overdue = invoice.status === 'overdue';
  return (
    <span className={cn(overdue && 'font-semibold text-overdue')}>
      {formatCalendarDate(invoice.dueDate)}
      {overdue && <span className="sr-only"> (overdue)</span>}
    </span>
  );
}

/** The red hazard edge down an overdue row; its row must be `relative`. */
function OverdueEdge({ invoice }: { invoice: InvoiceListItemDto }) {
  if (invoice.status !== 'overdue') return null;
  return <span aria-hidden="true" className="absolute inset-y-0 left-0 w-1 hazard-tape-overdue" />;
}

function hasBalance(invoice: InvoiceListItemDto): boolean {
  return invoice.balanceDue > 0 && invoice.status !== 'cancelled' && invoice.status !== 'draft';
}

const HEAD =
  'border-y border-line px-3 py-2 text-left label-mono font-medium whitespace-nowrap text-muted';
const CELL = 'border-b border-line px-3 py-2.5 text-sm whitespace-nowrap';

/**
 * A table from `md` up and stacked rows below, inside the list panel; each row links to the
 * invoice, so the whole row opens it. Overdue rows carry the red hazard edge.
 */
export function InvoiceList({ invoices }: { invoices: InvoiceListItemDto[] }) {
  return (
    <>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full">
          <thead className="bg-surface-muted">
            <tr>
              <th scope="col" className={cn(HEAD, 'pl-6')}>
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
              <th scope="col" className={cn(HEAD, 'pr-6 text-right')}>
                Balance due
              </th>
            </tr>
          </thead>
          <tbody className="[&>tr:last-child>td]:border-b-0">
            {invoices.map((invoice) => (
              <tr
                key={invoice.id}
                className="relative transition-colors focus-within:bg-surface-muted hover:bg-surface-muted"
              >
                <td className={cn(CELL, 'max-w-64 pl-6')}>
                  <OverdueEdge invoice={invoice} />
                  <div className="flex items-center gap-3">
                    <Avatar name={invoice.customerName} size="sm" />
                    <span className="truncate font-[650] text-ink">{invoice.customerName}</span>
                  </div>
                </td>
                <td className={CELL}>
                  {/* The link covers the whole row, so any part of it opens the invoice. */}
                  <Link
                    to={paths.invoice(invoice.id)}
                    className="rounded-sm font-mono text-[12.5px] text-ink-2 after:absolute after:inset-0 hover:text-primary-ink"
                  >
                    {invoice.invoiceNumber}
                  </Link>
                </td>
                <td className={cn(CELL, 'hidden text-[13px] text-ink-2 lg:table-cell')}>
                  {formatCalendarDate(invoice.issueDate)}
                </td>
                <td className={cn(CELL, 'text-[13px] text-ink-2')}>
                  <DueDate invoice={invoice} />
                </td>
                <td className={CELL}>
                  <InvoiceStatusBadge status={invoice.status} />
                </td>
                <td className={cn(CELL, 'text-right')}>
                  <span className="money text-[13.5px] font-medium text-ink-2">
                    {formatMoney(invoice.total, invoice.currency)}
                  </span>
                </td>
                <td className={cn(CELL, 'pr-6 text-right')}>
                  <span
                    className={cn(
                      'money text-[14px]',
                      hasBalance(invoice) ? 'text-ink' : 'font-medium text-muted',
                    )}
                  >
                    {formatMoney(invoice.balanceDue, invoice.currency)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="divide-y divide-line md:hidden">
        {invoices.map((invoice) => (
          <li key={invoice.id} className="relative">
            <OverdueEdge invoice={invoice} />
            <Link
              to={paths.invoice(invoice.id)}
              className="grid grid-cols-[36px_minmax(0,1fr)_auto] items-center gap-3 px-3.5 py-3 transition-colors hover:bg-surface-muted focus-visible:outline-offset-[-2px] active:bg-canvas-deep"
            >
              <Avatar name={invoice.customerName} size="md" />
              <span className="min-w-0">
                <span className="block truncate text-[14.5px] font-semibold text-ink">
                  {invoice.customerName}
                </span>
                <MetaLine className="mt-px text-[12.5px] text-muted">
                  <span className="font-mono">{invoice.invoiceNumber}</span>
                  <span>
                    Due <DueDate invoice={invoice} />
                  </span>
                </MetaLine>
              </span>
              <span className="flex flex-col items-end gap-1.5">
                <span className="text-right">
                  <span className="money block text-[13.5px] text-ink">
                    {formatMoney(
                      hasBalance(invoice) ? invoice.balanceDue : invoice.total,
                      invoice.currency,
                    )}
                  </span>
                  {hasBalance(invoice) && invoice.balanceDue !== invoice.total && (
                    <span className="block text-[11px] text-muted">
                      <span className="sr-only">due </span>of{' '}
                      <span className="money font-medium">
                        {formatMoney(invoice.total, invoice.currency)}
                      </span>
                    </span>
                  )}
                </span>
                <InvoiceStatusBadge status={invoice.status} />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}

export function InvoiceListSkeleton() {
  return (
    <div role="status" aria-label="Loading invoices" className="divide-y divide-line">
      {Array.from({ length: 6 }, (_, index) => (
        <div key={index} className="flex items-center gap-4 px-3.5 py-3.5 md:px-6">
          <Skeleton className="size-9 md:size-8" />
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="hidden h-4 w-24 md:block" />
          <Skeleton className="hidden h-4 w-24 md:block" />
          <Skeleton className="h-5.5 w-16 rounded-[5px]" />
          <Skeleton className="h-4 w-20" />
        </div>
      ))}
    </div>
  );
}

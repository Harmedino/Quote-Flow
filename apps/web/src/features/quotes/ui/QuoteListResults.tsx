import type { QuoteListItemDto } from '@quoteflow/shared';
import { Link } from 'react-router';
import { paths } from '@/app/paths';
import { QuoteStatusBadge } from '@/components/StatusBadge';
import { Avatar } from '@/components/ui/Avatar';
import { MetaLine } from '@/components/ui/MetaLine';
import { Skeleton } from '@/components/ui/Skeleton';
import { cn } from '@/lib/cn';
import { formatCalendarDate, formatMoney } from '@/lib/format';

const HEAD =
  'border-y border-line px-3 py-2 text-left label-mono font-medium whitespace-nowrap text-muted';
const CELL = 'border-b border-line px-3 py-2.5 whitespace-nowrap';

/**
 * A table from `md` up and stacked rows below, inside the list panel; each row links to the
 * quote, so the whole row opens it.
 */
export function QuoteListResults({ quotes }: { quotes: QuoteListItemDto[] }) {
  return (
    <>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full text-sm">
          <thead className="bg-surface-muted">
            <tr>
              <th scope="col" className={cn(HEAD, 'pl-6')}>
                Customer
              </th>
              <th scope="col" className={HEAD}>
                Quote
              </th>
              <th scope="col" className={HEAD}>
                Issued
              </th>
              <th scope="col" className={HEAD}>
                Valid until
              </th>
              <th scope="col" className={HEAD}>
                Status
              </th>
              <th scope="col" className={cn(HEAD, 'pr-6 text-right')}>
                Total
              </th>
            </tr>
          </thead>
          <tbody className="[&>tr:last-child>td]:border-b-0">
            {quotes.map((quote) => (
              <tr
                key={quote.id}
                className="relative transition-colors focus-within:bg-surface-muted hover:bg-surface-muted"
              >
                <td className={cn(CELL, 'max-w-72 pl-6')}>
                  <div className="flex items-center gap-3">
                    <Avatar name={quote.customerName} size="sm" />
                    <span className="truncate font-[650] text-ink">{quote.customerName}</span>
                  </div>
                </td>
                <td className={CELL}>
                  {/* The link covers the whole row, so any part of it opens the quote. */}
                  <Link
                    to={paths.quote(quote.id)}
                    className="rounded-sm font-mono text-[12.5px] text-ink-2 after:absolute after:inset-0 hover:text-primary-ink"
                  >
                    {quote.quoteNumber}
                  </Link>
                </td>
                <td className={cn(CELL, 'text-[13px] text-ink-2')}>
                  {formatCalendarDate(quote.issueDate)}
                </td>
                <td className={cn(CELL, 'text-[13px] text-ink-2')}>
                  {formatCalendarDate(quote.expiryDate)}
                </td>
                <td className={CELL}>
                  <QuoteStatusBadge status={quote.status} />
                </td>
                <td className={cn(CELL, 'pr-6 text-right')}>
                  <span className="money text-[14px] text-ink">
                    {formatMoney(quote.total, quote.currency)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="divide-y divide-line md:hidden">
        {quotes.map((quote) => (
          <li key={quote.id}>
            <Link
              to={paths.quote(quote.id)}
              className="grid grid-cols-[36px_minmax(0,1fr)_auto] items-center gap-3 px-3.5 py-3 transition-colors hover:bg-surface-muted focus-visible:outline-offset-[-2px] active:bg-canvas-deep"
            >
              <Avatar name={quote.customerName} size="md" />
              <span className="min-w-0">
                <span className="block truncate text-[14.5px] font-semibold text-ink">
                  {quote.customerName}
                </span>
                <MetaLine className="mt-px text-[12.5px] text-muted">
                  <span className="font-mono">{quote.quoteNumber}</span>
                  <span>Valid until {formatCalendarDate(quote.expiryDate)}</span>
                </MetaLine>
              </span>
              <span className="flex flex-col items-end gap-1.5">
                <span className="money text-[13.5px] text-ink">
                  {formatMoney(quote.total, quote.currency)}
                </span>
                <QuoteStatusBadge status={quote.status} />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}

export function QuoteListSkeleton() {
  return (
    <div role="status" aria-label="Loading quotes" className="divide-y divide-line">
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

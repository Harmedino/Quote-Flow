import type { QuoteListItemDto } from '@quoteflow/shared';
import { Link } from 'react-router';
import { paths } from '@/app/paths';
import { QuoteStatusAccent, QuoteStatusBadge } from '@/components/StatusBadge';
import { Avatar } from '@/components/ui/Avatar';
import { Skeleton } from '@/components/ui/Skeleton';
import { cn } from '@/lib/cn';
import { formatCalendarDate, formatMoney } from '@/lib/format';

const HEAD =
  'px-4 py-3 text-left text-xs font-medium tracking-wide whitespace-nowrap text-stone-500 uppercase';
const CELL = 'px-4 py-3 whitespace-nowrap';

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
              <th scope="col" className={cn(HEAD, 'pl-5')}>
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
              <th scope="col" className={cn(HEAD, 'pr-5 text-right')}>
                Total
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {quotes.map((quote) => (
              <tr
                key={quote.id}
                className="relative transition-colors focus-within:bg-stone-50 hover:bg-stone-50"
              >
                <td className={cn(CELL, 'max-w-72 pl-5')}>
                  <div className="flex items-center gap-3">
                    <Avatar name={quote.customerName} size="sm" />
                    <span className="truncate font-medium text-stone-900">
                      {quote.customerName}
                    </span>
                  </div>
                </td>
                <td className={CELL}>
                  {/* The link covers the whole row, so any part of it opens the quote. */}
                  <Link
                    to={paths.quote(quote.id)}
                    className="rounded-sm font-mono text-[13px] text-stone-600 after:absolute after:inset-0 hover:text-brand-700"
                  >
                    {quote.quoteNumber}
                  </Link>
                </td>
                <td className={cn(CELL, 'text-stone-600')}>
                  {formatCalendarDate(quote.issueDate)}
                </td>
                <td className={cn(CELL, 'text-stone-600')}>
                  {formatCalendarDate(quote.expiryDate)}
                </td>
                <td className={CELL}>
                  <QuoteStatusBadge status={quote.status} />
                </td>
                <td
                  className={cn(CELL, 'pr-5 text-right font-semibold text-stone-900 tabular-nums')}
                >
                  {formatMoney(quote.total, quote.currency)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="divide-y divide-stone-100 md:hidden">
        {quotes.map((quote) => (
          <li key={quote.id}>
            <Link
              to={paths.quote(quote.id)}
              className="flex items-center gap-3 px-3.5 py-3 transition-colors hover:bg-stone-50 focus-visible:outline-offset-[-2px] active:bg-stone-100"
            >
              <QuoteStatusAccent status={quote.status} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-stone-900">{quote.customerName}</p>
                <p className="mt-0.5 text-xs text-stone-500">
                  {quote.quoteNumber} · Valid until {formatCalendarDate(quote.expiryDate)}
                </p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                <span className="text-sm font-semibold text-stone-900 tabular-nums">
                  {formatMoney(quote.total, quote.currency)}
                </span>
                <QuoteStatusBadge status={quote.status} />
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}

export function QuoteListSkeleton() {
  return (
    <div role="status" aria-label="Loading quotes" className="divide-y divide-stone-100">
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

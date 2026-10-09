import type { QuoteListItemDto } from '@quoteflow/shared';
import { Link } from 'react-router';
import { paths } from '@/app/paths';
import { QuoteStatusBadge } from '@/components/StatusBadge';
import { Skeleton } from '@/components/ui/Skeleton';
import { cn } from '@/lib/cn';
import { formatCalendarDate, formatMoney } from '@/lib/format';

const HEAD = 'px-4 py-3 text-left text-xs font-medium tracking-wide text-zinc-500 uppercase';
const CELL = 'px-4 py-3.5 whitespace-nowrap';

/** A table from `md` up and stacked rows below, inside the list card; each row links to the quote. */
export function QuoteListResults({ quotes }: { quotes: QuoteListItemDto[] }) {
  return (
    <>
      <table className="hidden w-full text-sm md:table">
        <thead className="border-b border-zinc-200 bg-zinc-50/80">
          <tr>
            <th scope="col" className={cn(HEAD, 'pl-6')}>
              Quote
            </th>
            <th scope="col" className={HEAD}>
              Customer
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
        <tbody className="divide-y divide-zinc-100">
          {quotes.map((quote) => (
            <tr key={quote.id} className="relative transition-colors hover:bg-zinc-50">
              <td className={cn(CELL, 'pl-6 font-medium text-zinc-950')}>
                <Link
                  to={paths.quote(quote.id)}
                  className="rounded-sm after:absolute after:inset-0 focus-visible:outline-2 focus-visible:outline-brand-600"
                >
                  {quote.quoteNumber}
                </Link>
              </td>
              <td className={cn(CELL, 'max-w-64 truncate text-zinc-700')}>{quote.customerName}</td>
              <td className={cn(CELL, 'text-zinc-600')}>{formatCalendarDate(quote.issueDate)}</td>
              <td className={cn(CELL, 'text-zinc-600')}>{formatCalendarDate(quote.expiryDate)}</td>
              <td className={CELL}>
                <QuoteStatusBadge status={quote.status} />
              </td>
              <td className={cn(CELL, 'pr-6 text-right font-medium text-zinc-950 tabular-nums')}>
                {formatMoney(quote.total, quote.currency)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <ul className="divide-y divide-zinc-100 md:hidden">
        {quotes.map((quote) => (
          <li key={quote.id}>
            <Link
              to={paths.quote(quote.id)}
              className="block px-4 py-4 transition-colors hover:bg-zinc-50 focus-visible:bg-zinc-50 focus-visible:outline-none"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-medium text-zinc-950">{quote.customerName}</p>
                  <p className="mt-0.5 text-sm text-zinc-500">{quote.quoteNumber}</p>
                </div>
                <QuoteStatusBadge status={quote.status} />
              </div>
              <div className="mt-3 flex items-end justify-between gap-3 text-sm">
                <p className="text-zinc-600">Valid until {formatCalendarDate(quote.expiryDate)}</p>
                <p className="font-semibold text-zinc-950 tabular-nums">
                  {formatMoney(quote.total, quote.currency)}
                </p>
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
    <div role="status" aria-label="Loading quotes" className="divide-y divide-zinc-100">
      {Array.from({ length: 6 }, (_, index) => (
        <div key={index} className="flex items-center gap-4 px-4 py-4 md:px-6">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="hidden h-4 w-24 md:block" />
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-4 w-20" />
        </div>
      ))}
    </div>
  );
}

import type { QuoteListItemDto } from '@quoteflow/shared';
import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router';
import { paths } from '@/app/paths';
import { QuoteStatusBadge } from '@/components/StatusBadge';
import { Skeleton } from '@/components/ui/Skeleton';
import { formatCalendarDate, formatMoney } from '@/lib/format';

const HEAD = 'px-4 py-3 text-left text-xs font-medium tracking-wide text-zinc-500 uppercase';

/** A table from `md` up and stacked cards below; each row links to the quote. */
export function QuoteListResults({ quotes }: { quotes: QuoteListItemDto[] }) {
  return (
    <>
      <div className="hidden overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-xs md:block">
        <table className="w-full text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50/80">
            <tr>
              <th scope="col" className={HEAD}>
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
              <th scope="col" className={`${HEAD} text-right`}>
                Total
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {quotes.map((quote) => (
              <tr key={quote.id} className="relative transition-colors hover:bg-zinc-50">
                <td className="px-4 py-3.5 font-medium whitespace-nowrap text-zinc-950">
                  <Link
                    to={paths.quote(quote.id)}
                    className="after:absolute after:inset-0 focus-visible:outline-none focus-visible:after:rounded-sm focus-visible:after:outline-2 focus-visible:after:outline-brand-600"
                  >
                    {quote.quoteNumber}
                  </Link>
                </td>
                <td className="max-w-64 truncate px-4 py-3.5 text-zinc-700">
                  {quote.customerName}
                </td>
                <td className="px-4 py-3.5 whitespace-nowrap text-zinc-600">
                  {formatCalendarDate(quote.issueDate)}
                </td>
                <td className="px-4 py-3.5 whitespace-nowrap text-zinc-600">
                  {formatCalendarDate(quote.expiryDate)}
                </td>
                <td className="px-4 py-3.5">
                  <QuoteStatusBadge status={quote.status} />
                </td>
                <td className="px-4 py-3.5 text-right font-medium whitespace-nowrap text-zinc-950 tabular-nums">
                  {formatMoney(quote.total, quote.currency)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="space-y-3 md:hidden">
        {quotes.map((quote) => (
          <li key={quote.id}>
            <Link
              to={paths.quote(quote.id)}
              className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-white p-4 shadow-xs transition-colors hover:bg-zinc-50"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-semibold text-zinc-950">{quote.quoteNumber}</span>
                  <QuoteStatusBadge status={quote.status} />
                </div>
                <p className="mt-1 truncate text-sm text-zinc-700">{quote.customerName}</p>
                <div className="mt-2 flex items-baseline justify-between gap-3">
                  <span className="text-xs text-zinc-500">
                    Valid until {formatCalendarDate(quote.expiryDate)}
                  </span>
                  <span className="text-sm font-semibold text-zinc-950 tabular-nums">
                    {formatMoney(quote.total, quote.currency)}
                  </span>
                </div>
              </div>
              <ChevronRight aria-hidden="true" className="size-4 shrink-0 text-zinc-400" />
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}

export function QuoteListSkeleton() {
  return (
    <div
      role="status"
      aria-label="Loading quotes"
      className="space-y-3 rounded-xl border border-zinc-200 bg-white p-4 shadow-xs"
    >
      {Array.from({ length: 6 }, (_, index) => (
        <div key={index} className="flex items-center gap-4 py-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="hidden h-4 w-24 sm:block" />
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-4 w-20" />
        </div>
      ))}
    </div>
  );
}

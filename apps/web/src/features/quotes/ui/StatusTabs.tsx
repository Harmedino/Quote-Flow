import { Link, useSearchParams } from 'react-router';
import { cn } from '@/lib/cn';
import { QUOTE_STATUS_TABS, type QuoteStatusTab, writeQuoteListParams } from '../quote-list-params';

/** Status filters as links, so each filter has its own URL and works with back/forward. */
export function StatusTabs({ current }: { current: QuoteStatusTab }) {
  const [params] = useSearchParams();
  return (
    <nav
      aria-label="Filter quotes by status"
      className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0"
    >
      <ul className="flex min-w-max gap-1 border-b border-zinc-200">
        {QUOTE_STATUS_TABS.map((tab) => {
          const selected = tab.value === current;
          const search = writeQuoteListParams(params, { status: tab.value }).toString();
          return (
            <li key={tab.value}>
              <Link
                to={{ search: search ? `?${search}` : '' }}
                aria-current={selected ? 'page' : undefined}
                className={cn(
                  '-mb-px inline-flex h-10 items-center border-b-2 px-3 text-sm font-medium whitespace-nowrap transition-colors',
                  selected
                    ? 'border-brand-600 text-brand-700'
                    : 'border-transparent text-zinc-600 hover:border-zinc-300 hover:text-zinc-900',
                )}
              >
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

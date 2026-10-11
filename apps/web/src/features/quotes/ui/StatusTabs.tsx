import { Link, useSearchParams } from 'react-router';
import { CountChip } from '@/components/ui/CountChip';
import { TAB_LIST_CLASSES, TAB_SCROLLER_CLASSES, tabClasses } from '@/components/ui/tab-styles';
import { useDashboardQuery } from '@/features/dashboard/use-dashboard';
import { QUOTE_STATUS_TABS, type QuoteStatusTab, writeQuoteListParams } from '../quote-list-params';

/**
 * How many quotes are waiting on each tab, from the dashboard figures the top bar already uses:
 * the live ones (not expired), split into unopened and opened.
 */
function useWaitingCounts(): Partial<Record<QuoteStatusTab, number>> {
  const quotes = useDashboardQuery().data?.quotes;
  if (!quotes) return {};
  return { sent: quotes.pending - quotes.viewed, viewed: quotes.viewed };
}

/** Status filters as links, so each filter has its own URL and works with back/forward. */
export function StatusTabs({ current }: { current: QuoteStatusTab }) {
  const [params] = useSearchParams();
  const counts = useWaitingCounts();
  return (
    <nav aria-label="Filter quotes by status" className={TAB_SCROLLER_CLASSES}>
      <ul className={TAB_LIST_CLASSES}>
        {QUOTE_STATUS_TABS.map((tab) => {
          const selected = tab.value === current;
          const search = writeQuoteListParams(params, { status: tab.value }).toString();
          const count = counts[tab.value];
          return (
            <li key={tab.value}>
              <Link
                to={{ search: search ? `?${search}` : '' }}
                aria-current={selected ? 'page' : undefined}
                className={tabClasses(selected)}
              >
                {tab.label}
                {Boolean(count) && <CountChip label="waiting">{count}</CountChip>}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

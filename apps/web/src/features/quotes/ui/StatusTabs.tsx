import { Link, useSearchParams } from 'react-router';
import { TAB_LIST_CLASSES, TAB_SCROLLER_CLASSES, tabClasses } from '@/components/ui/tab-styles';
import { QUOTE_STATUS_TABS, type QuoteStatusTab, writeQuoteListParams } from '../quote-list-params';

/** Status filters as links, so each filter has its own URL and works with back/forward. */
export function StatusTabs({ current }: { current: QuoteStatusTab }) {
  const [params] = useSearchParams();
  return (
    <nav aria-label="Filter quotes by status" className={TAB_SCROLLER_CLASSES}>
      <ul className={TAB_LIST_CLASSES}>
        {QUOTE_STATUS_TABS.map((tab) => {
          const selected = tab.value === current;
          const search = writeQuoteListParams(params, { status: tab.value }).toString();
          return (
            <li key={tab.value}>
              <Link
                to={{ search: search ? `?${search}` : '' }}
                aria-current={selected ? 'page' : undefined}
                className={tabClasses(selected)}
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

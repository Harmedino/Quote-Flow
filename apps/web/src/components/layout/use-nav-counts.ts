import { useDashboardQuery } from '@/features/dashboard/use-dashboard';
import type { NavCounts } from './nav-items';

/**
 * The tab counts, taken from the dashboard figures: the same cached query, refreshed whenever a
 * quote or invoice changes. There are none until it loads, or if it fails.
 */
export function useNavCounts(): NavCounts | undefined {
  const { data } = useDashboardQuery();
  return (
    data && { awaitingQuotes: data.quotes.pending, overdueInvoices: data.invoices.overdueCount }
  );
}

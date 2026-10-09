import { useQuery } from '@tanstack/react-query';
import { useAuthenticatedSession } from '@/features/auth/use-session';
import { getDashboard } from './dashboard-api';

/** Quote and invoice mutations invalidate `['dashboard']`, so the key must start with it. */
export const dashboardQueryKey = (businessId: string) => ['dashboard', businessId] as const;

export function useDashboardQuery() {
  const { business } = useAuthenticatedSession();
  return useQuery({
    queryKey: dashboardQueryKey(business.id),
    queryFn: ({ signal }) => getDashboard(signal),
  });
}

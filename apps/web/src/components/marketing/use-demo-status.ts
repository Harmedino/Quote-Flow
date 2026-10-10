import { useQuery } from '@tanstack/react-query';
import { getDemoAvailability } from '@/features/auth/auth-api';

/**
 * The same query as useDemoLogin's (features/auth/use-demo-login.ts), so both share one
 * request; this one also tells "not yet known" apart from "unavailable".
 */
const DEMO_AVAILABILITY_KEY = ['auth', 'demo-availability'] as const;

export type DemoStatus = 'checking' | 'available' | 'unavailable';

/** Whether this deployment has the live demo (DEMO_LOGIN_ENABLED on the API). */
export function useDemoStatus(): DemoStatus {
  const { data, isPending } = useQuery({
    queryKey: DEMO_AVAILABILITY_KEY,
    queryFn: getDemoAvailability,
    staleTime: Number.POSITIVE_INFINITY,
    retry: false,
  });
  if (isPending) return 'checking';
  return data?.available ? 'available' : 'unavailable';
}

/**
 * Whether the website may point to the live demo. Assumed while the answer is on its way, so
 * pages with the demo (the usual deployment) don't change once it arrives.
 */
export function useLiveDemo(): boolean {
  return useDemoStatus() !== 'unavailable';
}

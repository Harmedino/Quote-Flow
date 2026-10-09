import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { paths } from '@/app/paths';
import { getDemoAvailability, startDemo } from './auth-api';
import { sessionStore } from './session-store';

const DEMO_AVAILABILITY_KEY = ['auth', 'demo-availability'] as const;

/** "Explore the demo": available only when the API has DEMO_LOGIN_ENABLED set. */
export function useDemoLogin() {
  const navigate = useNavigate();
  const availability = useQuery({
    queryKey: DEMO_AVAILABILITY_KEY,
    queryFn: getDemoAvailability,
    staleTime: Number.POSITIVE_INFINITY,
    retry: false,
  });
  const start = useMutation({
    mutationFn: startDemo,
    onSuccess: async (session) => {
      sessionStore.setSession(session);
      await navigate(paths.dashboard, { replace: true });
    },
  });

  return {
    available: availability.data?.available === true,
    start: () => start.mutate(),
    pending: start.isPending,
    error: start.error,
  };
}

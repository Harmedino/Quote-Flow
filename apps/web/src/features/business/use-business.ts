import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { sessionStore } from '@/features/auth/session-store';
import { useAuthenticatedSession } from '@/features/auth/use-session';
import { getBusiness, updateBusiness } from './business-api';

export const businessQueryKey = (businessId: string) => ['business', businessId] as const;

/**
 * The signed-in user's business. It renders straight away from the copy that
 * came with the session and is refetched in the background; fresh data also
 * updates the session, so the app shell never shows a stale name.
 */
export function useBusinessQuery() {
  const { business } = useAuthenticatedSession();
  return useQuery({
    queryKey: businessQueryKey(business.id),
    queryFn: async () => {
      const fresh = await getBusiness();
      sessionStore.updateBusiness(fresh);
      return fresh;
    },
    initialData: business,
    // The session's copy may be minutes old, so it is shown but always refetched.
    initialDataUpdatedAt: 0,
  });
}

export function useUpdateBusiness() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateBusiness,
    onSuccess: (business) => {
      queryClient.setQueryData(businessQueryKey(business.id), business);
      sessionStore.updateBusiness(business);
    },
  });
}

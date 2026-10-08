import { QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { sessionStore } from '@/features/auth/session-store';
import { createQueryClient } from '@/lib/query-client';

const queryClient = createQueryClient();

// Cached data belongs to the person who loaded it; drop it when someone else (or nobody) signs in.
sessionStore.onUserChange(() => queryClient.clear());

export function AppProviders({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

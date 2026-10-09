import type { DemoQuoteDto } from '@quoteflow/shared';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { paths } from '@/app/paths';
import { FROM_DEMO_STATE } from '@/features/public-documents/demo-state';
import { request } from '@/lib/api-client';

/** A demo quote its customer can still answer; the API sends a new one when none is left. */
function openDemoQuote(): Promise<DemoQuoteDto> {
  return request('/auth/demo/quote', { method: 'POST' });
}

/** "Open a quote as the customer": goes to that quote's customer page, with the demo bar. */
export function useOpenDemoQuote() {
  const navigate = useNavigate();
  return useMutation({
    mutationFn: openDemoQuote,
    onSuccess: async ({ publicToken }) => {
      await navigate(paths.publicQuote(publicToken), { state: FROM_DEMO_STATE });
    },
  });
}

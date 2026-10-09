import { MutationObserver, QueryClient } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { errorResponse, jsonResponse } from '@/test/fixtures';
import {
  answerQuoteOptions,
  publicQuoteKey,
  type QuoteAnswerVariables,
} from './use-public-documents';

const TOKEN = 'tok_123';
const fetchMock = vi.fn<typeof fetch>();

function sentBodies() {
  return fetchMock.mock.calls.map(([, init]) => init?.body);
}

function setup() {
  const queryClient = new QueryClient();
  queryClient.setQueryData(publicQuoteKey(TOKEN), { quote: { revision: 3 } });
  const observer = new MutationObserver(queryClient, answerQuoteOptions(queryClient, TOKEN));
  const answer = (variables: QuoteAnswerVariables) => observer.mutate(variables).catch(() => null);
  return { queryClient, observer, answer };
}

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('answerQuoteOptions', () => {
  it('answers the revision it is given, even after a refetch brings a newer one', async () => {
    const { queryClient, observer, answer } = setup();
    fetchMock.mockImplementation(() =>
      Promise.resolve(errorResponse(409, 'CONFLICT', 'This quote was just updated.')),
    );

    await answer({ answer: { action: 'accept' }, revision: 3 });
    // The refetch lands and the page re-renders, handing the observer fresh options.
    queryClient.setQueryData(publicQuoteKey(TOKEN), { quote: { revision: 4 } });
    observer.setOptions(answerQuoteOptions(queryClient, TOKEN));
    await answer({ answer: { action: 'accept' }, revision: 3 });

    expect(sentBodies()).toEqual(['{"revision":3}', '{"revision":3}']);
  });

  it('sends a decline reason with the revision', async () => {
    const { answer } = setup();
    fetchMock.mockResolvedValue(jsonResponse({ data: { quote: { revision: 3 } } }));

    await answer({ answer: { action: 'reject', reason: 'Too late' }, revision: 3 });

    expect(fetchMock.mock.calls[0]?.[0]).toBe(`/api/public/quotes/${TOKEN}/reject`);
    expect(sentBodies()).toEqual(['{"revision":3,"reason":"Too late"}']);
  });

  it('refetches the quote after a conflict, but not after other failures', async () => {
    const { queryClient, answer } = setup();
    const isInvalidated = () => queryClient.getQueryState(publicQuoteKey(TOKEN))?.isInvalidated;

    fetchMock.mockResolvedValue(errorResponse(429, 'RATE_LIMITED'));
    await answer({ answer: { action: 'accept' }, revision: 3 });
    expect(isInvalidated()).toBe(false);

    fetchMock.mockResolvedValue(errorResponse(409, 'CONFLICT'));
    await answer({ answer: { action: 'accept' }, revision: 3 });
    expect(isInvalidated()).toBe(true);
  });
});

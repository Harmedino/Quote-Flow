import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  ApiError,
  buildQueryString,
  request,
  requestPaginated,
  resolveApiBaseUrl,
} from './api-client';

const fetchMock = vi.fn<typeof fetch>();

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function lastFetchCall(): { url: string; init: RequestInit } {
  const call = fetchMock.mock.calls.at(-1);
  if (!call) {
    throw new Error('fetch was not called');
  }
  const [input, init = {}] = call;
  const url = input instanceof Request ? input.url : input.toString();
  return { url, init };
}

async function captureError(promise: Promise<unknown>): Promise<unknown> {
  try {
    await promise;
  } catch (error) {
    return error;
  }
  throw new Error('Expected the promise to reject');
}

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('resolveApiBaseUrl', () => {
  it('falls back to /api when unset or blank', () => {
    expect(resolveApiBaseUrl(undefined)).toBe('/api');
    expect(resolveApiBaseUrl('   ')).toBe('/api');
  });

  it('trims whitespace and trailing slashes', () => {
    expect(resolveApiBaseUrl(' https://api.example.com/ ')).toBe('https://api.example.com');
    expect(resolveApiBaseUrl('https://example.com/api//')).toBe('https://example.com/api');
  });
});

describe('buildQueryString', () => {
  it('encodes values, repeats arrays and skips null or undefined', () => {
    expect(
      buildQueryString({
        search: 'Smith & Sons',
        page: 2,
        archived: false,
        status: ['sent', 'viewed'],
        customerId: undefined,
        sort: null,
      }),
    ).toBe('search=Smith+%26+Sons&page=2&archived=false&status=sent&status=viewed');
  });

  it('returns an empty string without parameters', () => {
    expect(buildQueryString(undefined)).toBe('');
    expect(buildQueryString({ search: undefined })).toBe('');
  });
});

describe('request', () => {
  it('unwraps the data envelope and sends JSON headers with credentials', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ data: { id: 'q1', number: 'QT-0001' } }));

    await expect(request('/quotes/q1')).resolves.toEqual({ id: 'q1', number: 'QT-0001' });

    const { url, init } = lastFetchCall();
    expect(url).toBe('/api/quotes/q1');
    expect(init.method).toBe('GET');
    expect(init.credentials).toBe('include');
    expect(init.body).toBeUndefined();
    const headers = new Headers(init.headers);
    expect(headers.get('Accept')).toBe('application/json');
    expect(headers.has('Content-Type')).toBe(false);
  });

  it('builds the query string', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ data: [] }));

    await request('/customers', { query: { search: 'Ann Lee', page: 1, tag: undefined } });

    expect(lastFetchCall().url).toBe('/api/customers?search=Ann+Lee&page=1');
  });

  it('JSON-encodes the body and keeps caller headers', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ data: { id: 'c1' } }, 201));
    const controller = new AbortController();

    await request('/customers', {
      method: 'POST',
      body: { name: 'Ann Lee' },
      headers: { 'Idempotency-Key': 'abc' },
      signal: controller.signal,
    });

    const { init } = lastFetchCall();
    expect(init.method).toBe('POST');
    expect(init.body).toBe('{"name":"Ann Lee"}');
    expect(init.signal).toBe(controller.signal);
    const headers = new Headers(init.headers);
    expect(headers.get('Content-Type')).toBe('application/json');
    expect(headers.get('Idempotency-Key')).toBe('abc');
  });

  it('resolves undefined for 204 No Content', async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));

    await expect(request<void>('/sessions/current', { method: 'DELETE' })).resolves.toBeUndefined();
  });

  it('throws an ApiError built from the error envelope', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Some fields are invalid',
            details: [
              { path: 'email', message: 'Enter a valid email address' },
              { path: 'items.0.quantity', message: 'Quantity must be greater than zero' },
            ],
            requestId: 'req-123',
          },
        },
        422,
      ),
    );

    const error = await captureError(request('/customers', { method: 'POST', body: {} }));

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({
      name: 'ApiError',
      status: 422,
      code: 'VALIDATION_ERROR',
      message: 'Some fields are invalid',
      requestId: 'req-123',
      details: [
        { path: 'email', message: 'Enter a valid email address' },
        { path: 'items.0.quantity', message: 'Quantity must be greater than zero' },
      ],
    });
  });

  it('defaults details to an empty list when the envelope has none', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ error: { code: 'NOT_FOUND', message: 'Quote not found' } }, 404),
    );

    const error = await captureError(request('/quotes/missing'));

    expect(error).toMatchObject({ status: 404, code: 'NOT_FOUND', details: [] });
    expect((error as ApiError).requestId).toBeUndefined();
  });

  it('maps network failures to NETWORK_ERROR', async () => {
    const cause = new TypeError('Failed to fetch');
    fetchMock.mockRejectedValue(cause);

    const error = await captureError(request('/quotes'));

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 0, code: 'NETWORK_ERROR', cause });
  });

  it('maps a connection dropped while reading the body to NETWORK_ERROR', async () => {
    const brokenBody = new ReadableStream({
      start(controller) {
        controller.error(new TypeError('network connection lost'));
      },
    });
    fetchMock.mockResolvedValue(new Response(brokenBody, { status: 200 }));

    await expect(request('/quotes')).rejects.toMatchObject({ status: 0, code: 'NETWORK_ERROR' });
  });

  it('rethrows aborts untouched', async () => {
    const controller = new AbortController();
    controller.abort();
    const abortError = new DOMException('The operation was aborted.', 'AbortError');
    fetchMock.mockRejectedValue(abortError);

    await expect(request('/quotes', { signal: controller.signal })).rejects.toBe(abortError);
  });

  it('maps a non-JSON error body to INVALID_RESPONSE with the HTTP status', async () => {
    fetchMock.mockResolvedValue(
      new Response('<html>Bad gateway</html>', {
        status: 502,
        headers: { 'Content-Type': 'text/html' },
      }),
    );

    const error = await captureError(request('/quotes'));

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 502, code: 'INVALID_RESPONSE' });
  });

  it('maps error bodies that do not match the envelope to INVALID_RESPONSE', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ message: 'Not Found' }, 404));
    await expect(request('/quotes')).rejects.toMatchObject({
      status: 404,
      code: 'INVALID_RESPONSE',
    });

    fetchMock.mockResolvedValue(jsonResponse({ error: { code: 'TEAPOT', message: 'No' } }, 418));
    await expect(request('/quotes')).rejects.toMatchObject({ code: 'INVALID_RESPONSE' });
  });

  it('maps successful responses without a data envelope to INVALID_RESPONSE', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ id: 'q1' }));
    await expect(request('/quotes/q1')).rejects.toMatchObject({
      status: 200,
      code: 'INVALID_RESPONSE',
    });

    fetchMock.mockResolvedValue(new Response('OK', { status: 200 }));
    await expect(request('/quotes/q1')).rejects.toMatchObject({ code: 'INVALID_RESPONSE' });
  });
});

describe('requestPaginated', () => {
  it('returns the data and pagination meta', async () => {
    const meta = { page: 2, pageSize: 20, total: 41, totalPages: 3 };
    fetchMock.mockResolvedValue(jsonResponse({ data: [{ id: 'c1' }], meta }));

    await expect(requestPaginated('/customers', { query: { page: 2 } })).resolves.toEqual({
      data: [{ id: 'c1' }],
      meta,
    });
    expect(lastFetchCall().url).toBe('/api/customers?page=2');
  });

  it('rejects list responses without valid meta', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ data: [{ id: 'c1' }] }));

    await expect(requestPaginated('/customers')).rejects.toMatchObject({
      code: 'INVALID_RESPONSE',
    });
  });
});

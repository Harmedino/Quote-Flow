import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type * as ApiClient from '@/lib/api-client';
import { errorResponse, jsonResponse, noContent, testSession } from '@/test/fixtures';
import type * as Session from './session';
import { hasSessionHint, syncSessionHint } from './session-hint';
import type * as SessionStore from './session-store';

type Handler = (headers: Headers) => Response | Promise<Response>;

const fetchMock = vi.fn<typeof fetch>();
let handlers: Record<string, Handler[]> = {};

/** Answers each `METHOD /path` with its queued handlers in order; the last one repeats. */
function respond(key: string, ...queue: Handler[]) {
  handlers[key] = queue;
}

function requestKey(input: RequestInfo | URL, init: RequestInit | undefined): string {
  const url = input instanceof Request ? input.url : input.toString();
  return `${init?.method ?? 'GET'} ${url.replace(/^\/api/, '')}`;
}

function sentRequests(): { key: string; authorization: string | null }[] {
  return fetchMock.mock.calls.map(([input, init]) => ({
    key: requestKey(input, init),
    authorization: new Headers(init?.headers).get('Authorization'),
  }));
}

/** A promise with its resolver exposed, to control the order of responses. */
function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

/** Grants a named lock to one callback at a time, like the Web Locks API. */
function createLockManager() {
  const requested: string[] = [];
  let queue: Promise<unknown> = Promise.resolve();
  const locks = {
    requested,
    request(name: string, callback: () => Promise<unknown>) {
      requested.push(name);
      const run = queue.then(callback);
      queue = run.catch(() => undefined);
      return run;
    },
  };
  return locks;
}

/** An in-process BroadcastChannel, so "tabs" in one test can talk to each other. */
class FakeBroadcastChannel extends EventTarget {
  static open: FakeBroadcastChannel[] = [];
  constructor(readonly name: string) {
    super();
    FakeBroadcastChannel.open.push(this);
  }
  postMessage(data: unknown) {
    for (const channel of FakeBroadcastChannel.open) {
      if (channel !== this && channel.name === this.name) {
        channel.dispatchEvent(new MessageEvent('message', { data }));
      }
    }
  }
}

interface Tab {
  session: typeof Session;
  store: typeof SessionStore.sessionStore;
  client: typeof ApiClient;
}

/** Fresh copies of the session, store and API client modules, as in a newly opened tab. */
async function openTab(): Promise<Tab> {
  vi.resetModules();
  const session = await import('./session');
  const { sessionStore } = await import('./session-store');
  const client = await import('@/lib/api-client');
  session.installSession();
  return { session, store: sessionStore, client };
}

/** localStorage shared by every "tab" in a test, as in one browser. */
let stored: Map<string, string>;

function stubLocalStorage() {
  stored = new Map();
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => stored.get(key) ?? null,
    setItem: (key: string, value: string) => stored.set(key, value),
    removeItem: (key: string) => stored.delete(key),
  });
}

/** Sets the hint as a session in an earlier visit would have. */
function leaveHintFromEarlierVisit() {
  syncSessionHint({ status: 'authenticated', ...testSession() });
}

let locks: ReturnType<typeof createLockManager>;

beforeEach(() => {
  handlers = {};
  stubLocalStorage();
  fetchMock.mockReset();
  fetchMock.mockImplementation((input, init) => {
    const key = requestKey(input, init);
    const queue = handlers[key];
    const handler = queue && (queue.length > 1 ? queue.shift() : queue[0]);
    if (!handler) {
      throw new Error(`Unexpected request: ${key}`);
    }
    return Promise.resolve(handler(new Headers(init?.headers)));
  });
  locks = createLockManager();
  vi.stubGlobal('fetch', fetchMock);
  vi.stubGlobal('navigator', { locks });
  vi.stubGlobal('BroadcastChannel', FakeBroadcastChannel);
  FakeBroadcastChannel.open = [];
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('API requests with a session', () => {
  it('sends the access token as a Bearer header', async () => {
    const { store, client } = await openTab();
    store.setSession(testSession('token-1'));
    respond('GET /quotes', () => jsonResponse({ data: [] }));

    await client.request('/quotes');

    expect(sentRequests()).toEqual([{ key: 'GET /quotes', authorization: 'Bearer token-1' }]);
  });

  it('keeps an Authorization header set by the caller', async () => {
    const { store, client } = await openTab();
    store.setSession(testSession('token-1'));
    respond('GET /quotes', () => jsonResponse({ data: [] }));

    await client.request('/quotes', { headers: { Authorization: 'Bearer other' } });

    expect(sentRequests()[0]?.authorization).toBe('Bearer other');
  });

  it('renews the session once after a 401 and retries with the new token', async () => {
    const { store, client } = await openTab();
    store.setSession(testSession('token-1'));
    respond(
      'GET /business',
      () => errorResponse(401, 'UNAUTHORIZED'),
      () => jsonResponse({ data: { id: 'b1' } }),
    );
    respond('POST /auth/refresh', () => jsonResponse({ data: testSession('token-2') }));

    await expect(client.request('/business')).resolves.toEqual({ id: 'b1' });

    expect(sentRequests()).toEqual([
      { key: 'GET /business', authorization: 'Bearer token-1' },
      { key: 'POST /auth/refresh', authorization: 'Bearer token-1' },
      { key: 'GET /business', authorization: 'Bearer token-2' },
    ]);
    expect(store.getAccessToken()).toBe('token-2');
  });

  it('retries at most once', async () => {
    const { store, client } = await openTab();
    store.setSession(testSession('token-1'));
    respond('GET /business', () => errorResponse(401, 'UNAUTHORIZED'));
    respond('POST /auth/refresh', () => jsonResponse({ data: testSession('token-2') }));

    await expect(client.request('/business')).rejects.toMatchObject({ code: 'UNAUTHORIZED' });

    expect(sentRequests().map(({ key }) => key)).toEqual([
      'GET /business',
      'POST /auth/refresh',
      'GET /business',
    ]);
  });

  it('shares one refresh between requests rejected at the same time', async () => {
    const { store, client } = await openTab();
    store.setSession(testSession('token-1'));
    const refresh = deferred<Response>();
    respond('GET /quotes', (headers) =>
      headers.get('Authorization') === 'Bearer token-2'
        ? jsonResponse({ data: 'quotes' })
        : errorResponse(401, 'UNAUTHORIZED'),
    );
    respond('GET /invoices', (headers) =>
      headers.get('Authorization') === 'Bearer token-2'
        ? jsonResponse({ data: 'invoices' })
        : errorResponse(401, 'UNAUTHORIZED'),
    );
    respond('POST /auth/refresh', () => refresh.promise);

    const results = Promise.all([client.request('/quotes'), client.request('/invoices')]);
    await vi.waitFor(() =>
      expect(sentRequests().filter(({ key }) => key === 'POST /auth/refresh')).toHaveLength(1),
    );
    refresh.resolve(jsonResponse({ data: testSession('token-2') }));

    await expect(results).resolves.toEqual(['quotes', 'invoices']);
    expect(sentRequests().filter(({ key }) => key === 'POST /auth/refresh')).toHaveLength(1);
  });

  it('retries without refreshing again when another request already renewed the token', async () => {
    const { store, client } = await openTab();
    store.setSession(testSession('token-1'));
    const slowRejection = deferred<Response>();
    respond(
      'GET /quotes',
      () => errorResponse(401, 'UNAUTHORIZED'),
      () => jsonResponse({ data: 'quotes' }),
    );
    respond(
      'GET /invoices',
      () => slowRejection.promise,
      () => jsonResponse({ data: 'invoices' }),
    );
    respond('POST /auth/refresh', () => jsonResponse({ data: testSession('token-2') }));

    const invoices = client.request('/invoices');
    await expect(client.request('/quotes')).resolves.toBe('quotes');
    slowRejection.resolve(errorResponse(401, 'UNAUTHORIZED'));

    await expect(invoices).resolves.toBe('invoices');
    expect(sentRequests().filter(({ key }) => key === 'POST /auth/refresh')).toHaveLength(1);
    expect(sentRequests().at(-1)).toEqual({
      key: 'GET /invoices',
      authorization: 'Bearer token-2',
    });
  });

  it.each(['/auth/logout-all', '/auth/me', '/auth/login', '/auth/refresh'])(
    'never refreshes and retries after a 401 from %s',
    async (path) => {
      const { store, client } = await openTab();
      store.setSession(testSession('token-1'));
      respond(`POST ${path}`, () => errorResponse(401, 'UNAUTHORIZED'));
      respond(`GET ${path}`, () => errorResponse(401, 'UNAUTHORIZED'));

      const method = path === '/auth/me' ? 'GET' : 'POST';
      await expect(client.request(path, { method })).rejects.toMatchObject({
        code: 'UNAUTHORIZED',
      });

      expect(sentRequests()).toHaveLength(1);
    },
  );

  it('ends the session when the refresh is refused, and fails the request', async () => {
    const { store, client } = await openTab();
    store.setSession(testSession('token-1'));
    respond('GET /business', () => errorResponse(401, 'UNAUTHORIZED'));
    respond('POST /auth/refresh', () => errorResponse(401, 'UNAUTHORIZED'));

    await expect(client.request('/business')).rejects.toMatchObject({ status: 401 });

    expect(store.getSnapshot()).toEqual({ status: 'anonymous', endReason: 'expired' });
    expect(store.getAccessToken()).toBeNull();
    expect(sentRequests()).toHaveLength(2);
  });

  it('keeps the session when the refresh fails for a transient reason', async () => {
    const { store, client } = await openTab();
    store.setSession(testSession('token-1'));
    respond('GET /business', () => errorResponse(401, 'UNAUTHORIZED'));
    respond('POST /auth/refresh', () => errorResponse(503, 'SERVICE_UNAVAILABLE'));

    await expect(client.request('/business')).rejects.toMatchObject({
      code: 'SERVICE_UNAVAILABLE',
    });

    expect(store.getSnapshot().status).toBe('authenticated');
    expect(store.getAccessToken()).toBe('token-1');
  });
});

describe('refreshSession', () => {
  it('refreshes inside the cross-tab lock', async () => {
    const { session, store } = await openTab();
    const order: string[] = [];
    const request = locks.request.bind(locks);
    locks.request = (name, callback) => {
      order.push('lock requested');
      return request(name, () => {
        order.push('lock granted');
        return callback();
      });
    };
    respond('POST /auth/refresh', () => {
      order.push('refresh sent');
      return jsonResponse({ data: testSession('token-2') });
    });

    await expect(session.refreshSession()).resolves.toBe(true);

    expect(locks.requested).toEqual(['quoteflow-auth-refresh']);
    expect(order).toEqual(['lock requested', 'lock granted', 'refresh sent']);
    expect(store.getAccessToken()).toBe('token-2');
  });

  it('without Web Locks, retries once with the fresh cookie after losing a race to another tab', async () => {
    vi.stubGlobal('navigator', {});
    const { session, store } = await openTab();
    respond(
      'POST /auth/refresh',
      () => errorResponse(401, 'UNAUTHORIZED'),
      () => jsonResponse({ data: testSession('token-2') }),
    );

    await expect(session.refreshSession()).resolves.toBe(true);

    expect(sentRequests()).toHaveLength(2);
    expect(store.getAccessToken()).toBe('token-2');
  });
});

describe('a refused refresh', () => {
  it('does not end a session that was signed into while it was in flight', async () => {
    const { session, store } = await openTab();
    const refusal = deferred<Response>();
    respond('POST /auth/refresh', () => refusal.promise);

    const refreshed = session.refreshSession();
    await vi.waitFor(() => expect(sentRequests()).toHaveLength(1));
    store.setSession(testSession('signed-in-meanwhile'));
    refusal.resolve(errorResponse(401, 'UNAUTHORIZED'));

    await expect(refreshed).resolves.toBe(false);
    expect(store.getSnapshot().status).toBe('authenticated');
    expect(store.getAccessToken()).toBe('signed-in-meanwhile');
  });
});

describe('ensureSession', () => {
  it('checks the refresh cookie once, however many callers wait for it', async () => {
    const { session } = await openTab();
    respond('POST /auth/refresh', () => jsonResponse({ data: testSession('token-1') }));

    const [first, second] = await Promise.all([session.ensureSession(), session.ensureSession()]);
    const third = await session.ensureSession();

    expect(first.status).toBe('authenticated');
    expect(second).toBe(first);
    expect(third).toBe(first);
    expect(sentRequests()).toHaveLength(1);
  });

  it('settles as signed out when there is no valid cookie', async () => {
    const { session } = await openTab();
    respond('POST /auth/refresh', () => errorResponse(401, 'UNAUTHORIZED'));

    await expect(session.ensureSession()).resolves.toEqual({
      status: 'anonymous',
      endReason: null,
    });
    await session.ensureSession();

    expect(sentRequests()).toHaveLength(1);
  });

  it('rejects when the check fails, and tries again on the next call', async () => {
    const { session, store } = await openTab();
    respond(
      'POST /auth/refresh',
      () => errorResponse(500, 'INTERNAL_ERROR'),
      () => jsonResponse({ data: testSession('token-1') }),
    );

    await expect(session.ensureSession()).rejects.toMatchObject({ code: 'INTERNAL_ERROR' });
    expect(store.getSnapshot()).toEqual({ status: 'unknown' });

    await expect(session.ensureSession()).resolves.toMatchObject({ status: 'authenticated' });
  });
});

describe('signing out', () => {
  it('ends the server session, then the local one', async () => {
    const { session, store } = await openTab();
    store.setSession(testSession('token-1'));
    respond('POST /auth/logout', () => noContent());

    await session.signOut();

    expect(sentRequests()).toEqual([{ key: 'POST /auth/logout', authorization: 'Bearer token-1' }]);
    expect(store.getSnapshot()).toEqual({ status: 'anonymous', endReason: 'signed-out' });
  });

  it('stays signed in when the server could not end the session', async () => {
    const { session, store } = await openTab();
    store.setSession(testSession('token-1'));
    respond('POST /auth/logout', () => errorResponse(503, 'SERVICE_UNAVAILABLE'));

    await expect(session.signOut()).rejects.toMatchObject({ code: 'SERVICE_UNAVAILABLE' });

    expect(store.getSnapshot().status).toBe('authenticated');
  });

  it('signs other tabs out too', async () => {
    const first = await openTab();
    const second = await openTab();
    first.store.setSession(testSession('token-1'));
    second.store.setSession(testSession('token-1'));
    respond('POST /auth/logout', () => noContent());

    await first.session.signOut();

    expect(second.store.getSnapshot()).toEqual({ status: 'anonymous', endReason: 'signed-out' });
  });

  it('renews an expired access token before signing out everywhere', async () => {
    const { session, store } = await openTab();
    store.setSession(testSession('token-1'));
    respond(
      'POST /auth/logout-all',
      () => errorResponse(401, 'UNAUTHORIZED'),
      () => noContent(),
    );
    respond('POST /auth/refresh', () => jsonResponse({ data: testSession('token-2') }));

    await session.signOutEverywhere();

    expect(sentRequests()).toEqual([
      { key: 'POST /auth/logout-all', authorization: 'Bearer token-1' },
      { key: 'POST /auth/refresh', authorization: 'Bearer token-1' },
      { key: 'POST /auth/logout-all', authorization: 'Bearer token-2' },
    ]);
    expect(store.getSnapshot()).toEqual({ status: 'anonymous', endReason: 'signed-out' });
  });
});

describe('the sign-in hint', () => {
  it('is set when someone signs in', async () => {
    const { store } = await openTab();

    store.setSession(testSession('token-1'));

    expect(hasSessionHint()).toBe(true);
  });

  it('is set when the refresh cookie restores a session', async () => {
    const { session } = await openTab();
    respond('POST /auth/refresh', () => jsonResponse({ data: testSession('token-1') }));

    await session.ensureSession();

    expect(hasSessionHint()).toBe(true);
  });

  it('is cleared on sign-out', async () => {
    leaveHintFromEarlierVisit();
    const { session, store } = await openTab();
    store.setSession(testSession('token-1'));
    respond('POST /auth/logout', () => noContent());

    await session.signOut();

    expect(hasSessionHint()).toBe(false);
  });

  it('is cleared when another tab signs out', async () => {
    leaveHintFromEarlierVisit();
    const { store } = await openTab();
    store.setSession(testSession('token-1'));
    const otherTab = new FakeBroadcastChannel('quoteflow-auth');

    otherTab.postMessage('signed-out');

    expect(store.getSnapshot()).toEqual({ status: 'anonymous', endReason: 'signed-out' });
    expect(hasSessionHint()).toBe(false);
  });

  it('is cleared when the refresh cookie is refused', async () => {
    leaveHintFromEarlierVisit();
    const { session } = await openTab();
    respond('POST /auth/refresh', () => errorResponse(401, 'UNAUTHORIZED'));

    await session.ensureSession();

    expect(hasSessionHint()).toBe(false);
  });

  it('is cleared when a signed-in session can no longer be renewed', async () => {
    leaveHintFromEarlierVisit();
    const { store, client } = await openTab();
    store.setSession(testSession('token-1'));
    respond('GET /business', () => errorResponse(401, 'UNAUTHORIZED'));
    respond('POST /auth/refresh', () => errorResponse(401, 'UNAUTHORIZED'));

    await expect(client.request('/business')).rejects.toMatchObject({ status: 401 });

    expect(hasSessionHint()).toBe(false);
  });

  it('is kept when the refresh fails for a transient reason', async () => {
    leaveHintFromEarlierVisit();
    const { session } = await openTab();
    respond('POST /auth/refresh', () => errorResponse(503, 'SERVICE_UNAVAILABLE'));

    await expect(session.ensureSession()).rejects.toMatchObject({ code: 'SERVICE_UNAVAILABLE' });

    expect(hasSessionHint()).toBe(true);
  });
});

describe('ensureSessionIfHinted', () => {
  it('skips the cookie check without the hint, leaving the session unknown', async () => {
    const { session, store } = await openTab();

    await expect(session.ensureSessionIfHinted()).resolves.toEqual({ status: 'unknown' });

    expect(sentRequests()).toEqual([]);
    expect(store.getSnapshot()).toEqual({ status: 'unknown' });
  });

  it('still lets a protected route restore a session the hint missed', async () => {
    const { session } = await openTab();
    respond('POST /auth/refresh', () => jsonResponse({ data: testSession('token-1') }));

    await session.ensureSessionIfHinted();
    await expect(session.ensureSession()).resolves.toMatchObject({ status: 'authenticated' });

    expect(sentRequests().map(({ key }) => key)).toEqual(['POST /auth/refresh']);
    expect(hasSessionHint()).toBe(true);
  });

  it('checks the cookie when the hint is set', async () => {
    leaveHintFromEarlierVisit();
    const { session } = await openTab();
    respond('POST /auth/refresh', () => jsonResponse({ data: testSession('token-1') }));

    await expect(session.ensureSessionIfHinted()).resolves.toMatchObject({
      status: 'authenticated',
    });
    expect(sentRequests().map(({ key }) => key)).toEqual(['POST /auth/refresh']);
  });

  it('checks the cookie when storage cannot be read', async () => {
    vi.stubGlobal('localStorage', {
      getItem: () => {
        throw new DOMException('The operation is insecure.', 'SecurityError');
      },
    });
    const { session } = await openTab();
    respond('POST /auth/refresh', () => errorResponse(401, 'UNAUTHORIZED'));

    await expect(session.ensureSessionIfHinted()).resolves.toEqual({
      status: 'anonymous',
      endReason: null,
    });
    expect(sentRequests()).toHaveLength(1);
  });

  it('answers from the session already known in this tab, without a request', async () => {
    const { session, store } = await openTab();
    store.setSession(testSession('token-1'));
    stored.clear();

    await expect(session.ensureSessionIfHinted()).resolves.toMatchObject({
      status: 'authenticated',
    });
    expect(sentRequests()).toEqual([]);
  });
});

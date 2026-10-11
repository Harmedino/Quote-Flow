import { isApiError, setAuthHandler } from '@/lib/api-client';
import * as authApi from './auth-api';
import { hasSessionHint, syncSessionHint } from './session-hint';
import { type SessionSnapshot, sessionStore } from './session-store';

const REFRESH_LOCK_NAME = 'quoteflow-auth-refresh';
const AUTH_CHANNEL_NAME = 'quoteflow-auth';
const SIGNED_OUT_MESSAGE = 'signed-out';
/**
 * Without Web Locks two tabs can present the same refresh cookie at once. The
 * API hands both the same new token, unless the session has rotated again since
 * (or was rotated before successor tokens existed): then the loser is rejected
 * without revoking anything, and retries after a moment with the cookie the winner received.
 */
const REFRESH_RACE_RETRY_DELAY_MS = 300;

function isUnauthorized(error: unknown): boolean {
  return isApiError(error) && error.status === 401;
}

function lockManager(): LockManager | null {
  return typeof navigator !== 'undefined' && 'locks' in navigator ? navigator.locks : null;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Marks the session as gone after the refresh cookie was refused, unless
 * someone signed in while the refresh was in flight.
 */
function markSessionInvalid(tokenWhenSent: string | null): void {
  const { status } = sessionStore.getSnapshot();
  if (status !== 'anonymous' && sessionStore.getAccessToken() === tokenWhenSent) {
    sessionStore.clear(status === 'authenticated' ? 'expired' : null);
  }
}

async function refreshFromCookie(retryLostRace: boolean): Promise<boolean> {
  const tokenWhenSent = sessionStore.getAccessToken();
  try {
    sessionStore.setSession(await authApi.refresh());
    return true;
  } catch (error) {
    if (!isUnauthorized(error)) {
      throw error;
    }
  }
  if (retryLostRace) {
    await delay(REFRESH_RACE_RETRY_DELAY_MS);
    return refreshFromCookie(false);
  }
  markSessionInvalid(tokenWhenSent);
  return false;
}

let refreshInFlight: Promise<boolean> | null = null;

/**
 * Exchanges the refresh cookie for a new access token and stores the session.
 * Concurrent callers share one request, and a Web Lock serialises refreshes
 * across tabs; the refresh only starts once the lock is held, so it sends
 * whichever (rotated) cookie is current by then. Resolves false, clearing the
 * session, when there is no valid session. Network and server failures reject
 * and leave the session as it was.
 */
export function refreshSession(): Promise<boolean> {
  if (!refreshInFlight) {
    const locks = lockManager();
    const refresh = locks
      ? locks.request(REFRESH_LOCK_NAME, () => refreshFromCookie(false))
      : refreshFromCookie(true);
    refreshInFlight = refresh.finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
}

/** Retries a 401 only when no other request has renewed the token in the meantime. */
function renewSession(rejectedToken: string | null): Promise<boolean> {
  const current = sessionStore.getAccessToken();
  if (current && current !== rejectedToken) {
    return Promise.resolve(true);
  }
  return refreshSession();
}

let bootstrap: Promise<SessionSnapshot> | null = null;

/**
 * Resolves once it is known whether someone is signed in. The first call
 * checks the refresh cookie; later calls reuse that answer. A failed check
 * (offline, server error) rejects and is retried by the next call.
 */
export function ensureSession(): Promise<SessionSnapshot> {
  const snapshot = sessionStore.getSnapshot();
  if (snapshot.status !== 'unknown') {
    return Promise.resolve(snapshot);
  }
  bootstrap ??= refreshSession().then(
    () => sessionStore.getSnapshot(),
    (error: unknown) => {
      bootstrap = null;
      throw error;
    },
  );
  return bootstrap;
}

/**
 * Like {@link ensureSession}, for pages meant for signed-out visitors. Without the sign-in
 * hint this browser has most likely never signed in, so the cookie check (and its 401) is
 * skipped and the session stays unknown. Protected routes still check the cookie, so a
 * missing hint never locks anyone out.
 */
export function ensureSessionIfHinted(): Promise<SessionSnapshot> {
  const snapshot = sessionStore.getSnapshot();
  return snapshot.status === 'unknown' && !hasSessionHint()
    ? Promise.resolve(snapshot)
    : ensureSession();
}

let authChannel: BroadcastChannel | null = null;

function endSignedOut(): void {
  sessionStore.clear('signed-out');
  authChannel?.postMessage(SIGNED_OUT_MESSAGE);
}

/**
 * Signs out of this browser. The server session is ended first, so a failure
 * leaves the user signed in instead of keeping a valid cookie behind a signed-out UI.
 */
export async function signOut(): Promise<void> {
  await authApi.logout();
  endSignedOut();
}

/**
 * Signs out of every device. Auth endpoints are never refreshed and retried by
 * the API client, so an expired access token is renewed here explicitly.
 */
export async function signOutEverywhere(): Promise<void> {
  const token = sessionStore.getAccessToken();
  try {
    await authApi.logoutAll();
  } catch (error) {
    if (!isUnauthorized(error) || !(await renewSession(token))) {
      throw error;
    }
    await authApi.logoutAll();
  }
  endSignedOut();
}

/** Connects the session to the API client, other tabs and the sign-in hint. Call once. */
export function installSession(): void {
  setAuthHandler({ getAccessToken: () => sessionStore.getAccessToken(), renewSession });
  // Covers every way a session starts or ends: sign-in, refresh, sign-out here or in another
  // tab, and a refused refresh.
  sessionStore.subscribe(() => syncSessionHint(sessionStore.getSnapshot()));

  if (typeof BroadcastChannel === 'function' && !authChannel) {
    authChannel = new BroadcastChannel(AUTH_CHANNEL_NAME);
    authChannel.addEventListener('message', (event: MessageEvent<unknown>) => {
      if (event.data === SIGNED_OUT_MESSAGE) {
        sessionStore.clear('signed-out');
      }
    });
  }
}

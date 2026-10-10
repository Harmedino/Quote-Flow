import type { SessionSnapshot } from './session-store';

const SESSION_HINT_KEY = 'quoteflow_session_hint';

/**
 * Whether this browser has probably signed in, so pages for signed-out visitors can skip the
 * refresh-cookie check (and the API's 401 for it) for people who never have. It is only a
 * hint and never grants access: protected routes check the cookie whether or not it is set.
 */
export function hasSessionHint(): boolean {
  try {
    return localStorage.getItem(SESSION_HINT_KEY) !== null;
  } catch {
    // Storage unavailable: a session may still exist, so let the cookie be checked.
    return true;
  }
}

/** Sets the hint while someone is signed in and removes it once nobody is. */
export function syncSessionHint({ status }: SessionSnapshot): void {
  try {
    if (status === 'authenticated') {
      localStorage.setItem(SESSION_HINT_KEY, '1');
    } else if (status === 'anonymous') {
      localStorage.removeItem(SESSION_HINT_KEY);
    }
  } catch {
    // Ignore: the hint only saves a request.
  }
}

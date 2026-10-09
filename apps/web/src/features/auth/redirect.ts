import { paths, withRedirectTo } from '@/app/paths';

const MAX_REDIRECT_LENGTH = 2048;
/** Placeholder origin used only to check that a path cannot leave the app. */
const APP_ORIGIN = 'https://app.quoteflow.invalid';
/** Returning to these after signing in would only bounce back to the dashboard. */
const SIGNED_OUT_ONLY_PATHS: ReadonlySet<string> = new Set([paths.login, paths.register]);

function hasControlCharacters(value: string): boolean {
  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index);
    if (code < 0x20 || code === 0x7f) {
      return true;
    }
  }
  return false;
}

/**
 * Returns `value` when it is a path inside this app, otherwise null, so a
 * crafted `?redirectTo=` can never send someone to another site. Only
 * root-relative paths qualify: no scheme, no protocol-relative `//host`, no
 * backslashes (browsers read `/\host` as `//host`) and no control characters
 * (URL parsers drop them, turning `/\t/host` into `//host`).
 */
export function sanitizeRedirectPath(value: string | null | undefined): string | null {
  if (
    !value ||
    value.length > MAX_REDIRECT_LENGTH ||
    !value.startsWith('/') ||
    value.startsWith('//') ||
    value.includes('\\') ||
    hasControlCharacters(value)
  ) {
    return null;
  }
  let url: URL;
  try {
    url = new URL(value, APP_ORIGIN);
  } catch {
    return null;
  }
  if (url.origin !== APP_ORIGIN || SIGNED_OUT_ONLY_PATHS.has(url.pathname)) {
    return null;
  }
  return `${url.pathname}${url.search}${url.hash}`;
}

/** Where to go after signing in: the requested in-app path, or the dashboard. */
export function postSignInPath(redirectTo: string | null | undefined): string {
  return sanitizeRedirectPath(redirectTo) ?? paths.dashboard;
}

/** The sign-in URL that returns to `currentPath` (path and query) afterwards. */
export function signInPathFor(currentPath: string): string {
  return withRedirectTo(paths.login, currentPath === paths.dashboard ? null : currentPath);
}

/** Navigation state that tells the sign-in page the previous session ended on its own. */
export const SESSION_EXPIRED_STATE = { sessionExpired: true } as const;

export function isSessionExpiredState(state: unknown): boolean {
  return (
    typeof state === 'object' &&
    state !== null &&
    'sessionExpired' in state &&
    state.sessionExpired === true
  );
}

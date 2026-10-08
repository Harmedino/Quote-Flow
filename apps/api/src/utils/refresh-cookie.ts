import { type SetCookie, parseCookie, stringifySetCookie } from 'cookie';
import type { Request, Response } from 'express';
import type { Env } from '../config/env';
import { API_PREFIX } from '../config/paths';

export const REFRESH_COOKIE_NAME = 'qf_refresh';
/** The browser sends the refresh cookie to the auth endpoints only. */
export const REFRESH_COOKIE_PATH = `${API_PREFIX}/auth`;

const SECONDS_PER_DAY = 86_400;

export interface RefreshCookie {
  set(res: Response, refreshToken: string): void;
  clear(res: Response): void;
}

/** Secure in production, and whenever the web app itself is served over https. */
export function shouldUseSecureCookies(env: Pick<Env, 'NODE_ENV' | 'APP_URL'>): boolean {
  return env.NODE_ENV === 'production' || env.APP_URL.startsWith('https://');
}

/**
 * Writes the httpOnly refresh-token cookie. Clearing uses exactly the same
 * Path, SameSite and Secure attributes, or the browser would keep the original.
 */
export function createRefreshCookie(
  env: Pick<Env, 'NODE_ENV' | 'APP_URL' | 'REFRESH_TOKEN_TTL_DAYS'>,
): RefreshCookie {
  const attributes = {
    name: REFRESH_COOKIE_NAME,
    path: REFRESH_COOKIE_PATH,
    httpOnly: true,
    sameSite: 'strict',
    secure: shouldUseSecureCookies(env),
  } as const satisfies Omit<SetCookie, 'value'>;
  const maxAge = env.REFRESH_TOKEN_TTL_DAYS * SECONDS_PER_DAY;

  return {
    set(res, refreshToken) {
      res.append('Set-Cookie', stringifySetCookie({ ...attributes, value: refreshToken, maxAge }));
    },
    clear(res) {
      res.append(
        'Set-Cookie',
        stringifySetCookie({ ...attributes, value: '', maxAge: 0, expires: new Date(0) }),
      );
    },
  };
}

export function readRefreshCookie(req: Request): string | undefined {
  const header = req.headers.cookie;
  if (!header) return undefined;
  const value = parseCookie(header)[REFRESH_COOKIE_NAME];
  return value === '' ? undefined : value;
}

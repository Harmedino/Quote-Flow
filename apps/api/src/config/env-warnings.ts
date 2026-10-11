import type { Env } from './env';

/** What the warnings need from a logger, so the build-time check can print them as plain text. */
export interface EnvWarningLogger {
  warn(details: { variable: string }, message: string): void;
}

/** Addresses a host gives every project. Links on them show the host's name, not the client's. */
const DEFAULT_HOST_SUFFIXES = ['.vercel.app', '.onrender.com'];

export function usesDefaultHostName(url: string): boolean {
  const { hostname } = new URL(url);
  return DEFAULT_HOST_SUFFIXES.some((suffix) => hostname.endsWith(suffix));
}

/**
 * Logs what is valid but probably a mistake, by variable name. Runs at every start (a server
 * start or a Vercel cold start) and in the build-time check, so the seller sees it in both logs.
 */
export function warnAboutEnv(env: Env, logger: EnvWarningLogger): void {
  if (env.NODE_ENV === 'production' && usesDefaultHostName(env.APP_URL)) {
    logger.warn(
      { variable: 'APP_URL' },
      "APP_URL is the hosting provider's default address, so customer links show the host's name instead of the business's. Set APP_URL and CORS_ORIGIN to the business's own domain before sending customers any link.",
    );
  }
}

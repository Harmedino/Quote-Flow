import { type MiddlewareFunction, redirect } from 'react-router';
import { REDIRECT_TO_PARAM } from '@/app/paths';
import { postSignInPath, signInPathFor } from './redirect';
import { ensureSession } from './session';

/**
 * Route middleware for the signed-in app. It runs before the route renders, so
 * protected pages never flash for signed-out visitors (the root route's
 * HydrateFallback covers the first session check). Client middleware treats a
 * returned redirect exactly like a thrown one.
 */
export const requireSession: MiddlewareFunction = async ({ url }) => {
  const session = await ensureSession();
  return session.status === 'authenticated'
    ? undefined
    : redirect(signInPathFor(`${url.pathname}${url.search}`));
};

/** Route middleware for sign-in and sign-up: signed-in users continue into the app. */
export const redirectSignedIn: MiddlewareFunction = async ({ url }) => {
  // If the session cannot be checked right now (e.g. offline), the form is still shown.
  const session = await ensureSession().catch(() => null);
  return session?.status === 'authenticated'
    ? redirect(postSignInPath(url.searchParams.get(REDIRECT_TO_PARAM)))
    : undefined;
};

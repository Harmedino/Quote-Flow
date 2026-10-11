import { type MiddlewareFunction, redirect } from 'react-router';
import { REDIRECT_TO_PARAM } from '@/app/paths';
import { postSignInPath, signInPathFor } from './redirect';
import { ensureSession, ensureSessionIfHinted } from './session';

/**
 * Route middleware for the signed-in app. It runs before the route renders, so
 * protected pages never flash for signed-out visitors (the root route's
 * HydrateFallback covers the first session check). Client middleware treats a
 * returned redirect exactly like a thrown one. It checks the refresh cookie
 * whatever the sign-in hint says.
 */
export const requireSession: MiddlewareFunction = async ({ url }) => {
  const session = await ensureSession();
  return session.status === 'authenticated'
    ? undefined
    : redirect(signInPathFor(`${url.pathname}${url.search}`));
};

/**
 * Route middleware for sign-in and sign-up: signed-in users continue into the app. Visitors
 * who have never signed in here get the form without a session check.
 */
export const redirectSignedIn: MiddlewareFunction = async ({ url }) => {
  // If the session cannot be checked right now (e.g. offline), the form is still shown.
  const session = await ensureSessionIfHinted().catch(() => null);
  return session?.status === 'authenticated'
    ? redirect(postSignInPath(url.searchParams.get(REDIRECT_TO_PARAM)))
    : undefined;
};

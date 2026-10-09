import { useSyncExternalStore } from 'react';
import { type AuthenticatedSession, type SessionSnapshot, sessionStore } from './session-store';

export function useSession(): SessionSnapshot {
  return useSyncExternalStore(sessionStore.subscribe, sessionStore.getSnapshot);
}

/**
 * The signed-in user and business, for components inside the signed-in app.
 * The app layout only renders its pages while a session exists.
 */
export function useAuthenticatedSession(): AuthenticatedSession {
  const session = useSession();
  if (session.status !== 'authenticated') {
    throw new Error('useAuthenticatedSession() is only available inside the signed-in app');
  }
  return session;
}

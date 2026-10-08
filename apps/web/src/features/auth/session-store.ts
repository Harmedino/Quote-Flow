import type { AuthSessionDto, BusinessDto, UserDto } from '@quoteflow/shared';

/** Why a session ended: the user signed out, or it could no longer be renewed. */
export type SessionEndReason = 'signed-out' | 'expired';

export type SessionSnapshot =
  /** Before the first refresh-cookie check has completed. */
  | { status: 'unknown' }
  | { status: 'anonymous'; endReason: SessionEndReason | null }
  | { status: 'authenticated'; user: UserDto; business: BusinessDto };

export type AuthenticatedSession = Extract<SessionSnapshot, { status: 'authenticated' }>;

type Listener = () => void;

const UNKNOWN: SessionSnapshot = { status: 'unknown' };

/**
 * The signed-in user, their business and the access token, held in memory only.
 * The token is never written to Web Storage or a readable cookie, so it is not
 * part of the snapshot React renders; a reload starts from `unknown` and the
 * httpOnly refresh cookie re-establishes the session.
 *
 * Snapshots are immutable, as `useSyncExternalStore` requires.
 */
export class SessionStore {
  #snapshot: SessionSnapshot = UNKNOWN;
  #accessToken: string | null = null;
  readonly #listeners = new Set<Listener>();

  readonly getSnapshot = (): SessionSnapshot => this.#snapshot;

  readonly subscribe = (listener: Listener): (() => void) => {
    this.#listeners.add(listener);
    return () => {
      this.#listeners.delete(listener);
    };
  };

  /** Calls `listener` when a different user, or nobody, becomes signed in. */
  onUserChange(listener: Listener): () => void {
    let userId = sessionUserId(this.#snapshot);
    return this.subscribe(() => {
      const next = sessionUserId(this.#snapshot);
      if (next !== userId) {
        userId = next;
        listener();
      }
    });
  }

  getAccessToken(): string | null {
    return this.#accessToken;
  }

  setSession({ accessToken, user, business }: AuthSessionDto): void {
    this.#accessToken = accessToken;
    this.#publish({ status: 'authenticated', user, business });
  }

  updateUser(user: UserDto): void {
    const current = this.#snapshot;
    if (current.status === 'authenticated' && current.user.id === user.id) {
      this.#publish({ ...current, user });
    }
  }

  updateBusiness(business: BusinessDto): void {
    const current = this.#snapshot;
    if (current.status === 'authenticated' && current.business.id === business.id) {
      this.#publish({ ...current, business });
    }
  }

  clear(endReason: SessionEndReason | null): void {
    this.#accessToken = null;
    const current = this.#snapshot;
    if (current.status === 'anonymous' && current.endReason === endReason) {
      return;
    }
    this.#publish({ status: 'anonymous', endReason });
  }

  #publish(snapshot: SessionSnapshot): void {
    this.#snapshot = snapshot;
    for (const listener of [...this.#listeners]) {
      listener();
    }
  }
}

function sessionUserId(snapshot: SessionSnapshot): string | null {
  return snapshot.status === 'authenticated' ? snapshot.user.id : null;
}

export const sessionStore = new SessionStore();

import type { Types } from 'mongoose';
import { isDuplicateKeyError } from '../db/errors';
import {
  RetiredRefreshTokenModel,
  type SessionDocument,
  SessionModel,
  type SessionRevokedReason,
} from '../models';
import type { Clock } from '../utils/clock';
import {
  SECURE_TOKEN_PATTERN,
  createRefreshTokenSuccessor,
  generateRefreshToken,
  hashToken,
} from '../utils/tokens';

/**
 * How long a just-rotated refresh token is treated as a retry (two tabs
 * refreshing at once, or a page that reloaded before the refresh response
 * arrived) rather than a replay: it is handed the same successor again.
 */
export const REFRESH_REUSE_GRACE_MS = 20_000;

const DAY_MS = 24 * 60 * 60 * 1000;

export interface StartedSession {
  session: SessionDocument;
  refreshToken: string;
}

export type RotationOutcome =
  | ({ status: 'rotated' } & StartedSession)
  /** Unknown, expired or revoked. */
  | { status: 'invalid' }
  /** Retried inside the grace window, but the session has rotated past its successor since. */
  | { status: 'superseded' }
  /** A token rotated out earlier was replayed, so the session has been revoked. */
  | { status: 'reused'; session: SessionDocument };

export interface SessionOwner {
  userId: Types.ObjectId | string;
  businessId: Types.ObjectId | string;
}

/** One session of a user, as an access token names it. */
export interface SessionRef extends SessionOwner {
  sessionId: string;
}

type SessionKey = Pick<SessionDocument, '_id' | 'businessId'>;

export interface SessionService {
  start(owner: SessionOwner, userAgent: string | undefined): Promise<StartedSession>;
  rotate(refreshToken: string): Promise<RotationOutcome>;
  /** Whether the session is neither revoked nor expired. */
  isActive(ref: SessionRef): Promise<boolean>;
  revoke(session: SessionKey, reason: SessionRevokedReason): Promise<void>;
  /** Revokes one session of a user; returns how many were revoked (0 or 1). */
  revokeOne(ref: SessionRef, reason: SessionRevokedReason): Promise<number>;
  /** Revokes the session whose current or previous token this is; returns it, if it was active. */
  revokeByToken(
    refreshToken: string,
    reason: SessionRevokedReason,
  ): Promise<SessionDocument | null>;
  /** Revokes every active session of a user, optionally except one (the caller's own). */
  revokeAllForUser(
    owner: SessionOwner,
    reason: SessionRevokedReason,
    exceptSessionId?: string,
  ): Promise<number>;
}

export interface SessionServiceOptions {
  refreshTokenTtlDays: number;
  /** Keys each refresh token's successor (see createRefreshTokenSuccessor). */
  secret: string;
  clock: Clock;
}

/** Looks a token up by hash. A deliberate cross-tenant lookup: the token is the only identity. */
function findByTokenHash(field: 'tokenHash' | 'previousTokenHash', hash: string) {
  return SessionModel.findOne({ [field]: hash }, null, { skipTenantGuard: true });
}

export function createSessionService({
  refreshTokenTtlDays,
  secret,
  clock,
}: SessionServiceOptions): SessionService {
  const successorOf = createRefreshTokenSuccessor(secret);
  const expiryFrom = (now: Date) => new Date(now.getTime() + refreshTokenTtlDays * DAY_MS);
  const isLive = (session: SessionDocument, now: Date) =>
    session.revokedAt === null && session.expiresAt > now;

  async function revoke(session: SessionKey, reason: SessionRevokedReason): Promise<void> {
    await SessionModel.updateOne(
      { _id: session._id, businessId: session.businessId, revokedAt: null },
      { $set: { revokedAt: clock(), revokedReason: reason } },
    );
  }

  /** The live session a token older than the previous one was rotated out of, if any. */
  async function findByRetiredToken(tokenHash: string, now: Date) {
    // A deliberate cross-tenant lookup: the token is the only identity.
    const retired = await RetiredRefreshTokenModel.findOne({ tokenHash }, null, {
      skipTenantGuard: true,
    }).lean();
    if (!retired) return null;
    const session = await SessionModel.findOne({
      _id: retired.sessionId,
      businessId: retired.businessId,
    });
    return session && isLive(session, now) ? session : null;
  }

  /**
   * A rotation retried with the token it replaced gets the same successor again,
   * so every tab ends up with one current token. Read-only: nothing rotates.
   */
  function reissue(session: SessionDocument, refreshToken: string): RotationOutcome {
    const nextToken = successorOf(refreshToken);
    return session.tokenHash === hashToken(nextToken)
      ? { status: 'rotated', session, refreshToken: nextToken }
      : { status: 'superseded' };
  }

  /**
   * A token that is no longer current: the previous one inside the grace window
   * is a retry; any other is a replay (e.g. a stolen cookie), which revokes the session.
   */
  async function checkReplay(
    refreshToken: string,
    tokenHash: string,
    now: Date,
  ): Promise<RotationOutcome> {
    const previousOf = await findByTokenHash('previousTokenHash', tokenHash);
    if (previousOf) {
      if (!isLive(previousOf, now)) return { status: 'invalid' };
      const rotatedAgoMs = now.getTime() - (previousOf.rotatedAt?.getTime() ?? 0);
      if (rotatedAgoMs <= REFRESH_REUSE_GRACE_MS) return reissue(previousOf, refreshToken);
    }

    const session = previousOf ?? (await findByRetiredToken(tokenHash, now));
    if (!session) return { status: 'invalid' };
    await revoke(session, 'reuse_detected');
    return { status: 'reused', session };
  }

  /** A concurrent request rotated the same token first; it produced the same successor. */
  async function afterLostRace(
    current: SessionDocument,
    refreshToken: string,
    now: Date,
  ): Promise<RotationOutcome> {
    const latest = await SessionModel.findOne({ _id: current._id, businessId: current.businessId });
    return latest && isLive(latest, now) ? reissue(latest, refreshToken) : { status: 'invalid' };
  }

  async function retire(session: SessionDocument, tokenHash: string): Promise<void> {
    try {
      await RetiredRefreshTokenModel.create({
        businessId: session.businessId,
        sessionId: session._id,
        tokenHash,
        expiresAt: session.expiresAt,
      });
    } catch (error) {
      // A server without atomic compare-and-swap (e.g. FerretDB) can let two racing
      // rotations both succeed; they stored the same successor, so one record suffices.
      if (!isDuplicateKeyError(error)) throw error;
    }
  }

  return {
    async start(owner, userAgent) {
      const now = clock();
      const refreshToken = generateRefreshToken();
      const session = await SessionModel.create({
        businessId: owner.businessId,
        userId: owner.userId,
        tokenHash: hashToken(refreshToken),
        lastUsedAt: now,
        expiresAt: expiryFrom(now),
        userAgent,
      });
      return { session, refreshToken };
    },

    async rotate(refreshToken) {
      if (!SECURE_TOKEN_PATTERN.test(refreshToken)) return { status: 'invalid' };
      const now = clock();
      const tokenHash = hashToken(refreshToken);

      const current = await findByTokenHash('tokenHash', tokenHash);
      if (!current) return checkReplay(refreshToken, tokenHash, now);
      if (!isLive(current, now)) return { status: 'invalid' };

      // Derived, not random, so a retry with the same token can be handed it again.
      const nextToken = successorOf(refreshToken);
      // Compare-and-swap on the presented token: of two concurrent refreshes, only one matches.
      const rotated = await SessionModel.findOneAndUpdate(
        { _id: current._id, businessId: current.businessId, tokenHash, revokedAt: null },
        {
          $set: {
            tokenHash: hashToken(nextToken),
            previousTokenHash: tokenHash,
            rotatedAt: now,
            lastUsedAt: now,
            expiresAt: expiryFrom(now),
          },
        },
        { returnDocument: 'after' },
      );
      if (!rotated) return afterLostRace(current, refreshToken, now);
      await retire(rotated, tokenHash);
      return { status: 'rotated', session: rotated, refreshToken: nextToken };
    },

    async isActive({ sessionId, userId, businessId }) {
      const session = await SessionModel.exists({
        _id: sessionId,
        businessId,
        userId,
        revokedAt: null,
        expiresAt: { $gt: clock() },
      });
      return session !== null;
    },

    revoke,

    async revokeOne({ sessionId, userId, businessId }, reason) {
      const result = await SessionModel.updateOne(
        { _id: sessionId, businessId, userId, revokedAt: null },
        { $set: { revokedAt: clock(), revokedReason: reason } },
      );
      return result.modifiedCount;
    },

    async revokeByToken(refreshToken, reason) {
      if (!SECURE_TOKEN_PATTERN.test(refreshToken)) return null;
      const tokenHash = hashToken(refreshToken);
      const session =
        (await findByTokenHash('tokenHash', tokenHash)) ??
        (await findByTokenHash('previousTokenHash', tokenHash));
      if (!session || session.revokedAt !== null) return null;
      await revoke(session, reason);
      return session;
    },

    async revokeAllForUser(owner, reason, exceptSessionId) {
      const result = await SessionModel.updateMany(
        {
          businessId: owner.businessId,
          userId: owner.userId,
          revokedAt: null,
          ...(exceptSessionId !== undefined && { _id: { $ne: exceptSessionId } }),
        },
        { $set: { revokedAt: clock(), revokedReason: reason } },
      );
      return result.modifiedCount;
    },
  };
}

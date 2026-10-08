import type { Types } from 'mongoose';
import { type SessionDocument, SessionModel, type SessionRevokedReason } from '../models';
import type { Clock } from '../utils/clock';
import { SECURE_TOKEN_PATTERN, generateRefreshToken, hashToken } from '../utils/tokens';

/**
 * How long a just-rotated refresh token is treated as a benign race (two tabs
 * refreshing at once) rather than a replay: it is rejected, but the session survives.
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
  /** Rotated moments ago by a concurrent request; the caller may retry with the newer cookie. */
  | { status: 'superseded' }
  /** A token rotated out earlier was replayed, so the session has been revoked. */
  | { status: 'reused'; session: SessionDocument };

export interface SessionOwner {
  userId: Types.ObjectId | string;
  businessId: Types.ObjectId | string;
}

export interface SessionService {
  start(owner: SessionOwner, userAgent: string | undefined): Promise<StartedSession>;
  rotate(refreshToken: string): Promise<RotationOutcome>;
  revoke(session: SessionDocument, reason: SessionRevokedReason): Promise<void>;
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
  clock: Clock;
}

/** Looks a token up by hash. A deliberate cross-tenant lookup: the token is the only identity. */
function findByTokenHash(field: 'tokenHash' | 'previousTokenHash', hash: string) {
  return SessionModel.findOne({ [field]: hash }, null, { skipTenantGuard: true });
}

export function createSessionService({
  refreshTokenTtlDays,
  clock,
}: SessionServiceOptions): SessionService {
  const expiryFrom = (now: Date) => new Date(now.getTime() + refreshTokenTtlDays * DAY_MS);
  const isLive = (session: SessionDocument, now: Date) =>
    session.revokedAt === null && session.expiresAt > now;

  async function revoke(session: SessionDocument, reason: SessionRevokedReason): Promise<void> {
    await SessionModel.updateOne(
      { _id: session._id, businessId: session.businessId, revokedAt: null },
      { $set: { revokedAt: clock(), revokedReason: reason } },
    );
  }

  /** A token that is no longer current: a racing tab inside the grace window, otherwise a replay. */
  async function checkReplay(tokenHash: string, now: Date): Promise<RotationOutcome> {
    const session = await findByTokenHash('previousTokenHash', tokenHash);
    if (!session || !isLive(session, now)) return { status: 'invalid' };

    const rotatedAgoMs = now.getTime() - (session.rotatedAt?.getTime() ?? 0);
    if (rotatedAgoMs <= REFRESH_REUSE_GRACE_MS) return { status: 'superseded' };

    await revoke(session, 'reuse_detected');
    return { status: 'reused', session };
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
      if (!current) return checkReplay(tokenHash, now);
      if (!isLive(current, now)) return { status: 'invalid' };

      const nextToken = generateRefreshToken();
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
      if (!rotated) return { status: 'superseded' };
      return { status: 'rotated', session: rotated, refreshToken: nextToken };
    },

    revoke,

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

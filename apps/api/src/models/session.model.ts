import { type HydratedDocument, Schema, type Types, model } from 'mongoose';
import { serialization } from './plugins/serialization';
import { type TenantOwned, tenantGuard } from './plugins/tenant-guard';
import type { Timestamps } from './types';

export const SESSION_REVOKED_REASONS = [
  'logout',
  'logout_all',
  'password_changed',
  'reuse_detected',
  /** The user or business behind the session no longer exists. */
  'account_removed',
] as const;
export type SessionRevokedReason = (typeof SESSION_REVOKED_REASONS)[number];

export const SESSION_USER_AGENT_MAX_LENGTH = 256;

/**
 * One signed-in browser or device. The refresh token is rotated on every
 * refresh; only SHA-256 hashes of the current and the previous token are kept,
 * the latter to recognise a replayed (possibly stolen) token. Revoked sessions
 * stay until they expire, so a replay of their tokens is still recognised.
 */
export interface Session extends TenantOwned, Timestamps {
  userId: Types.ObjectId;
  tokenHash: string;
  previousTokenHash: string | null;
  rotatedAt: Date | null;
  lastUsedAt: Date;
  /** Sliding: moved forward on every refresh. The TTL index deletes the session afterwards. */
  expiresAt: Date;
  revokedAt: Date | null;
  revokedReason: SessionRevokedReason | null;
  userAgent?: string;
}

export type SessionDocument = HydratedDocument<Session>;

function truncateUserAgent(value: unknown): unknown {
  return typeof value === 'string' ? value.slice(0, SESSION_USER_AGENT_MAX_LENGTH) : value;
}

const sessionSchema = new Schema<Session>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, immutable: true },
    tokenHash: { type: String, required: true },
    previousTokenHash: { type: String, default: null },
    rotatedAt: { type: Date, default: null },
    lastUsedAt: { type: Date, required: true },
    expiresAt: { type: Date, required: true },
    revokedAt: { type: Date, default: null },
    revokedReason: { type: String, enum: [...SESSION_REVOKED_REASONS, null], default: null },
    userAgent: { type: String, set: truncateUserAgent, maxlength: SESSION_USER_AGENT_MAX_LENGTH },
  },
  { timestamps: true },
);

sessionSchema.plugin(tenantGuard);
sessionSchema.plugin(serialization, { hidden: ['tokenHash', 'previousTokenHash'] });

sessionSchema.index({ tokenHash: 1 }, { unique: true });
sessionSchema.index({ previousTokenHash: 1 });
sessionSchema.index({ businessId: 1, userId: 1 });
sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const SessionModel = model<Session>('Session', sessionSchema);

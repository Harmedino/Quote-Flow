import { Schema, type Types, model } from 'mongoose';
import { serialization } from './plugins/serialization';
import { type TenantOwned, tenantGuard } from './plugins/tenant-guard';

/**
 * The hash of a refresh token rotated out of its session. Kept for as long as
 * the token itself could have lived, so a replay of any earlier token (not
 * only the immediately previous one) is recognised and revokes the session.
 */
export interface RetiredRefreshToken extends TenantOwned {
  tokenHash: string;
  sessionId: Types.ObjectId;
  /** The TTL index deletes the record afterwards. */
  expiresAt: Date;
}

const retiredRefreshTokenSchema = new Schema<RetiredRefreshToken>({
  tokenHash: { type: String, required: true, immutable: true },
  sessionId: { type: Schema.Types.ObjectId, ref: 'Session', required: true, immutable: true },
  expiresAt: { type: Date, required: true },
});

retiredRefreshTokenSchema.plugin(tenantGuard);
retiredRefreshTokenSchema.plugin(serialization, { hidden: ['tokenHash'] });

retiredRefreshTokenSchema.index({ tokenHash: 1 }, { unique: true });
retiredRefreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const RetiredRefreshTokenModel = model<RetiredRefreshToken>(
  'RetiredRefreshToken',
  retiredRefreshTokenSchema,
);

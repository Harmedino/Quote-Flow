import { USER_ROLES, type UserRole, objectIdSchema } from '@quoteflow/shared';
import { SignJWT, errors, jwtVerify } from 'jose';
import { z } from 'zod';
import type { Clock } from '../utils/clock';

export const ACCESS_TOKEN_ISSUER = 'quoteflow-api';
export const ACCESS_TOKEN_AUDIENCE = 'quoteflow-app';
const ALGORITHM = 'HS256';

/** Who the bearer of a valid access token is. */
export interface AuthContext {
  userId: string;
  businessId: string;
  role: UserRole;
  sessionId: string;
}

export interface IssuedAccessToken {
  token: string;
  expiresAt: Date;
}

export interface AccessTokenService {
  issue(identity: AuthContext): Promise<IssuedAccessToken>;
  /** The identity in a valid token, or null for a malformed, forged, expired or foreign one. */
  verify(token: string): Promise<AuthContext | null>;
}

export interface AccessTokenServiceOptions {
  secret: string;
  ttlSeconds: number;
  clock: Clock;
}

const claimsSchema = z.object({
  sub: objectIdSchema,
  bid: objectIdSchema,
  role: z.enum(USER_ROLES),
  sid: objectIdSchema,
});

const toEpochSeconds = (date: Date) => Math.floor(date.getTime() / 1000);

/**
 * Short-lived HS256 access tokens. Verification pins the algorithm, issuer,
 * audience and type, so tokens signed any other way (including `alg: none`) are rejected.
 */
export function createAccessTokenService({
  secret,
  ttlSeconds,
  clock,
}: AccessTokenServiceOptions): AccessTokenService {
  const key = new TextEncoder().encode(secret);

  return {
    async issue({ userId, businessId, role, sessionId }) {
      const issuedAt = toEpochSeconds(clock());
      const expiresAt = issuedAt + ttlSeconds;
      const token = await new SignJWT({ bid: businessId, role, sid: sessionId })
        .setProtectedHeader({ alg: ALGORITHM, typ: 'JWT' })
        .setIssuer(ACCESS_TOKEN_ISSUER)
        .setAudience(ACCESS_TOKEN_AUDIENCE)
        .setSubject(userId)
        .setIssuedAt(issuedAt)
        .setExpirationTime(expiresAt)
        .sign(key);
      return { token, expiresAt: new Date(expiresAt * 1000) };
    },

    async verify(token) {
      let payload: unknown;
      try {
        ({ payload } = await jwtVerify(token, key, {
          algorithms: [ALGORITHM],
          issuer: ACCESS_TOKEN_ISSUER,
          audience: ACCESS_TOKEN_AUDIENCE,
          typ: 'JWT',
          requiredClaims: ['iat', 'exp'],
          currentDate: clock(),
        }));
      } catch (error) {
        if (error instanceof errors.JOSEError) return null;
        throw error;
      }

      const claims = claimsSchema.safeParse(payload);
      if (!claims.success) return null;
      const { sub, bid, role, sid } = claims.data;
      return { userId: sub, businessId: bid, role, sessionId: sid };
    },
  };
}

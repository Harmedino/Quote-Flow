import { createHash, randomBytes } from 'node:crypto';

const SECURE_TOKEN_BYTES = 32;

/** The shape of every token generated here: 256 random bits as 43 base64url characters. */
export const SECURE_TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;
export const PUBLIC_TOKEN_PATTERN = SECURE_TOKEN_PATTERN;

function generateSecureToken(): string {
  return randomBytes(SECURE_TOKEN_BYTES).toString('base64url');
}

/**
 * An unguessable, URL-safe capability token (256 bits of entropy) for links
 * shared with customers who have no account, such as public quote pages.
 */
export function generatePublicToken(): string {
  return generateSecureToken();
}

/** An opaque refresh-session secret (256 bits). Only its hash is ever stored. */
export function generateRefreshToken(): string {
  return generateSecureToken();
}

/**
 * SHA-256 of a token, for storing and looking up secrets without keeping them.
 * A plain hash suffices: the input is 256 random bits, so there is nothing to brute-force.
 */
export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('base64url');
}

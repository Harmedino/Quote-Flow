import { randomBytes } from 'node:crypto';

const PUBLIC_TOKEN_BYTES = 32;

/** The shape of every token produced by `generatePublicToken` (43 base64url characters). */
export const PUBLIC_TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;

/**
 * An unguessable, URL-safe capability token (256 bits of entropy) for links
 * shared with customers who have no account, such as public quote pages.
 */
export function generatePublicToken(): string {
  return randomBytes(PUBLIC_TOKEN_BYTES).toString('base64url');
}

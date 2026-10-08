import { randomBytes } from 'node:crypto';
import bcrypt from 'bcrypt';

const BCRYPT_COST = 12;
/** bcrypt ignores every byte after the 72nd. */
const BCRYPT_MAX_BYTES = 72;

let dummyHash: Promise<string> | undefined;

/** A hash of a random secret, compared against when there is no real hash so timing stays constant. */
function getDummyHash(): Promise<string> {
  dummyHash ??= bcrypt.hash(randomBytes(32).toString('base64url'), BCRYPT_COST);
  return dummyHash;
}

/**
 * Computes the dummy hash ahead of time (at startup), so the first sign-in
 * attempt for an unknown email takes no longer than any other.
 */
export async function preparePasswordVerification(): Promise<void> {
  await getDummyHash();
}

export async function hashPassword(password: string): Promise<string> {
  // passwordSchema rejects such passwords at the edge; this keeps them from being silently truncated.
  if (Buffer.byteLength(password, 'utf8') > BCRYPT_MAX_BYTES) {
    throw new RangeError('Password exceeds the 72-byte bcrypt limit');
  }
  return bcrypt.hash(password, BCRYPT_COST);
}

/**
 * Checks a password against a stored hash. When there is no hash (e.g. the
 * account does not exist) the same bcrypt work is still performed, so response
 * timing does not reveal whether an account exists.
 */
export async function verifyPassword(
  password: string,
  passwordHash: string | null | undefined,
): Promise<boolean> {
  if (!passwordHash) {
    await bcrypt.compare(password, await getDummyHash());
    return false;
  }
  return bcrypt.compare(password, passwordHash);
}

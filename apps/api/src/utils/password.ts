import { randomBytes } from 'node:crypto';
import bcrypt from 'bcryptjs';

const BCRYPT_COST = 12;

let dummyHash: Promise<string> | undefined;

/** A hash of a random secret, compared against when there is no real hash so timing stays constant. */
function getDummyHash(): Promise<string> {
  dummyHash ??= bcrypt.hash(randomBytes(32).toString('base64url'), BCRYPT_COST);
  return dummyHash;
}

export async function hashPassword(password: string): Promise<string> {
  // bcrypt ignores everything after 72 bytes; passwordSchema rejects such passwords at the edge.
  if (bcrypt.truncates(password)) {
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

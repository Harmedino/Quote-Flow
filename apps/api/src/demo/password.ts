import { randomBytes } from 'node:crypto';
import { passwordSchema } from '@quoteflow/shared';

export const SEED_PASSWORD_VARIABLE = 'SEED_DEMO_PASSWORD';

export interface DemoPassword {
  value: string;
  /** False when it came from SEED_DEMO_PASSWORD, which is then never printed back. */
  generated: boolean;
}

/** SEED_DEMO_PASSWORD failed the password rules. The message never includes the value. */
export class InvalidSeedPasswordError extends Error {
  constructor(reason: string) {
    super(`Invalid ${SEED_PASSWORD_VARIABLE}: ${reason}`);
    this.name = 'InvalidSeedPasswordError';
  }
}

/**
 * The demo users' password: SEED_DEMO_PASSWORD when set (for stable demos),
 * otherwise a random one per run so no known credential is created by default.
 */
export function resolveDemoPassword(source: NodeJS.ProcessEnv = process.env): DemoPassword {
  const supplied = source[SEED_PASSWORD_VARIABLE];
  if (supplied === undefined || supplied.trim() === '') {
    return { value: randomBytes(12).toString('base64url'), generated: true };
  }
  const result = passwordSchema.safeParse(supplied);
  if (!result.success) {
    throw new InvalidSeedPasswordError(result.error.issues[0]?.message ?? 'Invalid password');
  }
  return { value: supplied, generated: false };
}

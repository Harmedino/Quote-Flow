import { readVariable } from './env';
import type { EnvWarningLogger } from './env-warnings';

/** Names already reported by this process: one server start, or one Vercel cold start. */
const reported = new Set<string>();

export interface DeprecatedEnvOptions {
  logger: EnvWarningLogger;
  source?: NodeJS.ProcessEnv;
}

/**
 * For a renamed or retired variable: while it is still set, logs `message` once per process and
 * returns true. The variable no longer has any effect and is never mapped to its replacement.
 * The call stays for one release, then goes with the variable.
 */
export function deprecatedEnv(
  name: string,
  message: string,
  { logger, source = process.env }: DeprecatedEnvOptions,
): boolean {
  if (readVariable(source, name) === undefined) return false;
  if (!reported.has(name)) {
    reported.add(name);
    logger.warn({ variable: name }, message);
  }
  return true;
}

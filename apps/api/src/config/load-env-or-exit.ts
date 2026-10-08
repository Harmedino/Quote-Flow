import { EnvValidationError } from './env';

/**
 * For entry points: runs an environment loader (`loadEnv` or `loadScriptEnv`),
 * printing configuration problems (names only, never values) and exiting on failure.
 */
export function loadEnvOrExit<T>(load: () => T): T {
  try {
    return load();
  } catch (error) {
    if (error instanceof EnvValidationError) {
      process.stderr.write(`${error.message}\n`);
      process.exit(1);
    }
    throw error;
  }
}

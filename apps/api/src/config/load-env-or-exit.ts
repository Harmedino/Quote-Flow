import { EnvValidationError, type Env, loadEnv } from './env';

/** For entry points: prints configuration problems (names only, never values) and exits. */
export function loadEnvOrExit(): Env {
  try {
    return loadEnv();
  } catch (error) {
    if (error instanceof EnvValidationError) {
      process.stderr.write(`${error.message}\n`);
      process.exit(1);
    }
    throw error;
  }
}

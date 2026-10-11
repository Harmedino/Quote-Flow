import { type Env, EnvValidationError, parseEnv, readVariable } from './env';
import { warnAboutEnv } from './env-warnings';

export interface EnvCheckOutput {
  info(line: string): void;
  error(line: string): void;
}

/** Which rules apply, and why. A production host gets production rules even without NODE_ENV. */
function chooseRules(source: NodeJS.ProcessEnv): { production: boolean; reason: string } {
  for (const name of ['NODE_ENV', 'VERCEL_ENV']) {
    if (readVariable(source, name) === 'production') {
      return { production: true, reason: `production rules, because ${name}=production` };
    }
  }
  return {
    production: false,
    reason: 'development rules, because neither NODE_ENV nor VERCEL_ENV is production',
  };
}

/**
 * The build-time environment check (`pnpm env:check`, first in the Vercel build command): the
 * server's own validation, run before anything is deployed. Returns the exit code. A failure
 * names each variable (never a value) and fails the build, so the current deployment keeps
 * serving instead of a new one that answers 503.
 *
 * Vercel's preview and development builds are skipped: they often have no database or secrets
 * (those are usually set for Production only), and a broken preview serves nobody.
 */
export function checkEnv(source: NodeJS.ProcessEnv, output: EnvCheckOutput): 0 | 1 {
  const vercelEnv = readVariable(source, 'VERCEL_ENV');
  if (vercelEnv !== undefined && vercelEnv !== 'production') {
    output.info(
      `Environment check skipped: not a production deployment (VERCEL_ENV=${vercelEnv}).`,
    );
    return 0;
  }
  const { production, reason } = chooseRules(source);
  let env: Env;
  try {
    env = parseEnv(source, { production });
  } catch (error) {
    if (!(error instanceof EnvValidationError)) throw error;
    output.error(`Environment check failed (${reason}).`);
    output.error(error.message);
    output.error(
      "Fix these variables in the host's environment settings, then deploy again. A build that fails here deploys nothing, so the current deployment keeps serving.",
    );
    return 1;
  }
  warnAboutEnv(env, { warn: (_details, message) => output.info(`Warning: ${message}`) });
  output.info(`Environment check passed (${reason}).`);
  return 0;
}

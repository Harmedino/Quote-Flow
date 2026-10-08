import { type ScriptEnv, loadScriptEnv } from '../config/env';
import { loadEnvOrExit } from '../config/load-env-or-exit';
import { connectDatabase, disconnectDatabase } from '../db/connection';
import { type Logger, createLogger, shouldUsePrettyLogs } from '../utils/logger';

export interface ScriptContext {
  env: ScriptEnv;
  logger: Logger;
}

/**
 * Runs a one-off command-line task: loads the environment (only NODE_ENV,
 * MONGODB_URI and LOG_LEVEL; the server's variables are not needed), connects
 * to MongoDB (without automatic index builds), runs `task`, disconnects and
 * sets the exit code. A task signals failure by throwing or by returning false.
 */
export async function runScript(
  name: string,
  task: (context: ScriptContext) => Promise<boolean | void>,
): Promise<void> {
  const env = loadEnvOrExit(loadScriptEnv);
  const logger = createLogger({ level: env.LOG_LEVEL, pretty: shouldUsePrettyLogs(env.NODE_ENV) });

  let succeeded = false;
  try {
    await connectDatabase(env.MONGODB_URI, { autoIndex: false, logger });
    succeeded = (await task({ env, logger })) !== false;
  } catch (error) {
    logger.fatal({ err: error }, `${name} failed`);
  } finally {
    await disconnectDatabase().catch((error: unknown) => {
      logger.error({ err: error }, 'Failed to close the MongoDB connection');
    });
  }
  process.exitCode = succeeded ? 0 : 1;
}

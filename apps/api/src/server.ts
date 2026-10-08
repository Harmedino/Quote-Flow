import { once } from 'node:events';
import { type Server, createServer } from 'node:http';
import { createApp } from './app';
import type { Env } from './config/env';
import { loadEnvOrExit } from './config/load-env-or-exit';
import { connectDatabase, disconnectDatabase } from './db/connection';
import { type Logger, createLogger } from './utils/logger';

const SHUTDOWN_TIMEOUT_MS = 10_000;

function closeServer(server: Server): Promise<void> {
  return new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
    // In-flight requests are allowed to finish; idle keep-alive sockets are closed now.
    server.closeIdleConnections();
  });
}

/**
 * SIGINT/SIGTERM and unhandled rejections stop accepting connections, let
 * in-flight requests finish, close the database connection and exit — or
 * force an exit if that takes longer than SHUTDOWN_TIMEOUT_MS.
 */
function enableGracefulShutdown(server: Server, logger: Logger): void {
  let shuttingDown = false;

  const shutdown = async (reason: string, exitCode = 0): Promise<void> => {
    if (shuttingDown) return;
    shuttingDown = true;
    logger.info({ reason }, 'Shutting down');

    const forceExit = setTimeout(() => {
      logger.error('Graceful shutdown timed out; forcing exit');
      process.exit(1);
    }, SHUTDOWN_TIMEOUT_MS);
    forceExit.unref();

    try {
      await closeServer(server);
      await disconnectDatabase();
      logger.info('Shutdown complete');
    } catch (error) {
      logger.error({ err: error }, 'Error during shutdown');
      exitCode = 1;
    }
    process.exit(exitCode);
  };

  // `once`, so a second Ctrl+C falls back to Node's default and exits immediately.
  for (const signal of ['SIGINT', 'SIGTERM'] as const) {
    process.once(signal, () => void shutdown(signal));
  }
  process.on('unhandledRejection', (reason) => {
    logger.fatal({ err: reason }, 'Unhandled promise rejection');
    void shutdown('unhandledRejection', 1);
  });
}

async function start(env: Env, logger: Logger): Promise<void> {
  await connectDatabase(env.MONGODB_URI, {
    autoIndex: env.NODE_ENV !== 'production',
    logger,
  });

  const server = createServer(createApp({ env, logger }));
  server.listen(env.PORT);
  await once(server, 'listening');

  enableGracefulShutdown(server, logger);
  logger.info(
    { port: env.PORT, nodeEnv: env.NODE_ENV },
    `QuoteFlow API listening on port ${env.PORT}`,
  );
}

const env = loadEnvOrExit();
const logger = createLogger({ level: env.LOG_LEVEL, pretty: env.NODE_ENV === 'development' });

process.on('uncaughtException', (error) => {
  logger.fatal({ err: error }, 'Uncaught exception');
  process.exit(1);
});

try {
  await start(env, logger);
} catch (error) {
  logger.fatal({ err: error }, 'API failed to start');
  process.exit(1);
}

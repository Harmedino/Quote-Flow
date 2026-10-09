import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Express } from 'express';
import { createApp } from './app';
import { EnvValidationError, loadEnv } from './config/env';
import { connectDatabase } from './db/connection';
import { buildDeclaredIndexes, findMissingIndexes } from './db/indexes';
import { ALL_MODELS } from './models';
import { type Logger, createLogger } from './utils/logger';
import { preparePasswordVerification } from './utils/password';

/**
 * Entry point for running the API as one Vercel Function (see vercel.json).
 * A warm instance reuses the app and its database connection between
 * requests. A cold one connects first and creates any missing indexes,
 * because a Vercel deploy has no separate step to run db:indexes.
 */

const SERVERLESS_POOL_SIZE = 5;

let ready: Promise<Express> | undefined;

async function ensureIndexes(logger: Logger): Promise<void> {
  if ((await findMissingIndexes(ALL_MODELS)).length === 0) return;
  const failed = (await buildDeclaredIndexes(ALL_MODELS)).filter(
    (report) => report.missing.length > 0,
  );
  if (failed.length > 0) {
    logger.fatal({ failed }, 'Declared MongoDB indexes could not be created');
    throw new Error('Declared MongoDB indexes could not be created');
  }
  logger.info('Created missing MongoDB indexes');
}

async function initialise(): Promise<Express> {
  const env = loadEnv();
  const logger = createLogger({ level: env.LOG_LEVEL, pretty: false });
  await connectDatabase(env.MONGODB_URI, {
    autoIndex: false,
    logger,
    maxPoolSize: SERVERLESS_POOL_SIZE,
  });
  await ensureIndexes(logger);
  await preparePasswordVerification();
  return createApp({ env, logger });
}

function respondUnavailable(res: ServerResponse): void {
  res.statusCode = 503;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(
    JSON.stringify({
      error: {
        code: 'SERVICE_UNAVAILABLE',
        message: 'The service is temporarily unavailable.',
      },
    }),
  );
}

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  ready ??= initialise();
  let app: Express;
  try {
    app = await ready;
  } catch (error) {
    // Retry on the next request instead of caching the failure for the instance's lifetime.
    ready = undefined;
    // Misconfiguration must be visible in the Vercel logs; the message names variables, never values.
    const reason = error instanceof EnvValidationError ? error.message : String(error);
    process.stderr.write(`QuoteFlow API failed to start: ${reason}\n`);
    respondUnavailable(res);
    return;
  }
  app(req, res);
}

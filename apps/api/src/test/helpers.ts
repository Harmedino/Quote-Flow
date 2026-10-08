import type { ApiErrorBody, ApiErrorResponse, ApiResponse } from '@quoteflow/shared';
import express, { type Express, type Router } from 'express';
import { type Env, loadEnv } from '../config/env';
import { errorHandler } from '../middleware/error-handler';
import { notFound } from '../middleware/not-found';
import { createRequestLogger } from '../middleware/request-logger';
import { type Logger, createLogger } from '../utils/logger';

export const TEST_ORIGIN = 'http://localhost:5173';

export function createTestEnv(overrides: NodeJS.ProcessEnv = {}): Env {
  return loadEnv({
    NODE_ENV: 'test',
    MONGODB_URI: 'mongodb://127.0.0.1:27017/quoteflow_test',
    JWT_SECRET: 'test-only-jwt-secret-that-is-long-enough-123',
    CORS_ORIGIN: TEST_ORIGIN,
    ...overrides,
  });
}

export function createSilentLogger(): Logger {
  return createLogger({ level: 'silent', pretty: false });
}

export type LogEntry = Record<string, unknown> & { level: string; msg?: string };

/** A JSON logger whose output is kept in memory so tests can inspect it. */
export function createCapturingLogger(): { logger: Logger; entries: () => LogEntry[] } {
  const lines: string[] = [];
  const logger = createLogger({
    level: 'trace',
    pretty: false,
    destination: { write: (line: string) => void lines.push(line) },
  });
  const entries = () =>
    lines.map((line) => {
      const entry: unknown = JSON.parse(line);
      return entry as LogEntry;
    });
  return { logger, entries };
}

/**
 * Mounts a router between the app's real request logger and its real
 * not-found/error handlers, for testing middleware with test-only routes.
 */
export function createRouterTestApp(
  router: Router,
  logger: Logger = createSilentLogger(),
): Express {
  const app = express();
  app.use(createRequestLogger(logger));
  app.use(express.json({ limit: '100kb' }));
  app.use(router);
  app.use(notFound);
  app.use(errorHandler);
  return app;
}

/** Typed views of a supertest response body (which supertest types as `any`). */
export function dataOf<T>(res: { body: unknown }): T {
  return (res.body as ApiResponse<T>).data;
}

export function errorOf(res: { body: unknown }): ApiErrorBody {
  return (res.body as ApiErrorResponse).error;
}

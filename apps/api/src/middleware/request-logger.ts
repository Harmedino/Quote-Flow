import { randomUUID } from 'node:crypto';
import type { IncomingMessage } from 'node:http';
import type { Request, RequestHandler, Response } from 'express';
import type { LevelWithSilent } from 'pino';
import { pinoHttp } from 'pino-http';
import { API_PREFIX, isHealthCheckUrl } from '../config/paths';
import type { Logger } from '../utils/logger';

export const REQUEST_ID_HEADER = 'X-Request-Id';
const VALID_REQUEST_ID = /^[A-Za-z0-9_-]{1,64}$/;

/** Reuses a well-formed inbound request id (e.g. from a load balancer) or generates one. */
function resolveRequestId(inbound: string | string[] | undefined): string {
  return typeof inbound === 'string' && VALID_REQUEST_ID.test(inbound) ? inbound : randomUUID();
}

export function getRequestId(req: IncomingMessage): string | undefined {
  return typeof req.id === 'string' ? req.id : undefined;
}

// Express matches routes case-insensitively, so the mask does too.
const PUBLIC_TOKEN_IN_URL = new RegExp(`^(${API_PREFIX}/public/(?:quotes|invoices)/)[^/?#]+`, 'i');

/** Public document tokens are capabilities, so they never reach the logs. */
export function maskUrlTokens(url: string): string {
  return url.replace(PUBLIC_TOKEN_IN_URL, '$1:token');
}

/** Bodies, headers and query objects are deliberately not logged. */
function serializeRequest(req: Request) {
  return {
    method: req.method,
    url: maskUrlTokens(req.originalUrl),
    ip: req.ip,
    userAgent: req.get('user-agent'),
  };
}

function serializeResponse(res: Response) {
  return { statusCode: res.statusCode };
}

function summarize(req: Request, res: Response): string {
  return `${req.method} ${maskUrlTokens(req.originalUrl)} ${res.writableEnded ? res.statusCode : 'aborted'}`;
}

/**
 * Successful health checks are not logged (load balancers poll them), but a
 * health request that actually failed with an exception still is.
 */
function requestLogLevel(req: Request, res: Response, error?: Error): LevelWithSilent {
  if (error !== undefined || res.err !== undefined) return 'error';
  if (isHealthCheckUrl(req.originalUrl)) return 'silent';
  if (res.statusCode >= 500) return 'error';
  if (res.statusCode >= 400) return 'warn';
  return 'info';
}

/**
 * Assigns each request an id (echoed in the X-Request-Id response header),
 * exposes a request-scoped `req.log`, and logs one line per completed request.
 * Server errors are logged here with the error the error handler attaches to `res.err`.
 */
export function createRequestLogger(logger: Logger): RequestHandler {
  return pinoHttp<Request, Response>({
    logger,
    genReqId: (req, res) => {
      const id = resolveRequestId(req.headers['x-request-id']);
      res.setHeader(REQUEST_ID_HEADER, id);
      return id;
    },
    quietReqLogger: true,
    wrapSerializers: false,
    serializers: { req: serializeRequest, res: serializeResponse },
    customLogLevel: requestLogLevel,
    customSuccessMessage: summarize,
    customErrorMessage: summarize,
  });
}

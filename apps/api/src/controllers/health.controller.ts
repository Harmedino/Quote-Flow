import type { HealthStatus } from '@quoteflow/shared';
import type { Request, Response } from 'express';
import { isDatabaseConnected } from '../db/connection';
import { getRequestId } from '../middleware/request-logger';
import { serviceUnavailable } from '../utils/app-error';
import { sendData, sendError } from '../utils/response';

/** Liveness: the process is up and serving requests. */
export function getLiveness(_req: Request, res: Response): void {
  sendData(res, { status: 'ok' });
}

/**
 * Readiness: the API can serve traffic, i.e. its database is reachable.
 * A 503 is sent directly rather than through the error handler, so load
 * balancers polling during an outage do not log an error per probe.
 */
export function getReadiness(req: Request, res: Response): void {
  if (!isDatabaseConnected()) {
    sendError(
      res,
      serviceUnavailable('The service is temporarily unavailable.'),
      getRequestId(req),
    );
    return;
  }
  const health: HealthStatus = {
    status: 'ok',
    database: 'connected',
    uptimeSeconds: Math.floor(process.uptime()),
  };
  sendData(res, health);
}

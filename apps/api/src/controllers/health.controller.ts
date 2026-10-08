import type { HealthStatus } from '@quoteflow/shared';
import type { Request, Response } from 'express';
import { isDatabaseConnected } from '../db/connection';
import { sendData } from '../utils/response';

/** Liveness: the process is up and serving requests. */
export function getLiveness(_req: Request, res: Response): void {
  sendData(res, { status: 'ok' });
}

/** Readiness: the API can serve traffic, i.e. its database is reachable. */
export function getReadiness(_req: Request, res: Response): void {
  const connected = isDatabaseConnected();
  const health: HealthStatus = {
    status: connected ? 'ok' : 'unavailable',
    database: connected ? 'connected' : 'disconnected',
    uptimeSeconds: Math.floor(process.uptime()),
  };
  sendData(res, health, connected ? 200 : 503);
}

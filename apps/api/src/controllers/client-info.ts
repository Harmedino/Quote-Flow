import type { Request } from 'express';
import type { ClientInfo } from '../services/auth.service';

/** The request-scoped logger (its lines carry the request id) and the client's user agent. */
export function clientInfoOf(req: Request): ClientInfo {
  return { log: req.log, userAgent: req.get('user-agent') };
}

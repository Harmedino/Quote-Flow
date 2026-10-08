import { Router } from 'express';
import { createHealthRouter } from './health.routes';

/** All API routes, mounted under API_PREFIX by the app. */
export function createApiRouter(): Router {
  const router = Router();
  router.use('/health', createHealthRouter());
  return router;
}

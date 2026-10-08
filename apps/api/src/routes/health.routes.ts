import { Router } from 'express';
import { getLiveness, getReadiness } from '../controllers/health.controller';
import { noStore } from '../middleware/no-store';

export function createHealthRouter(): Router {
  const router = Router();
  router.use(noStore);
  router.get('/', getReadiness);
  router.get('/live', getLiveness);
  return router;
}

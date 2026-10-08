import { type RequestHandler, Router } from 'express';
import {
  getBusiness,
  updateBusiness,
  updateBusinessSchemas,
} from '../controllers/business.controller';
import { requireRole } from '../middleware/auth';
import { noStore } from '../middleware/no-store';
import { validate } from '../middleware/validate';

export function createBusinessRouter({ requireAuth }: { requireAuth: RequestHandler }): Router {
  const router = Router();
  router.use(noStore, requireAuth);

  router.get('/', getBusiness);
  router.patch('/', requireRole('owner'), validate(updateBusinessSchemas), updateBusiness);
  return router;
}

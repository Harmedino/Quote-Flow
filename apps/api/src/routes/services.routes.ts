import { type RequestHandler, Router } from 'express';
import {
  createService,
  createServiceSchemas,
  deleteService,
  getService,
  listServices,
  listServicesSchemas,
  serviceIdSchemas,
  updateService,
  updateServiceSchemas,
} from '../controllers/service.controller';
import { noStore } from '../middleware/no-store';
import { validate } from '../middleware/validate';

/** The business's service catalogue. Owners and staff both manage it. */
export function createServicesRouter({ requireAuth }: { requireAuth: RequestHandler }): Router {
  const router = Router();
  router.use(noStore, requireAuth);

  router.get('/', validate(listServicesSchemas), listServices);
  router.post('/', validate(createServiceSchemas), createService);
  router.get('/:id', validate(serviceIdSchemas), getService);
  router.patch('/:id', validate(updateServiceSchemas), updateService);
  router.delete('/:id', validate(serviceIdSchemas), deleteService);
  return router;
}

import { type RequestHandler, Router } from 'express';
import {
  archiveCustomer,
  createCustomer,
  createCustomerSchemas,
  customerIdSchemas,
  getCustomer,
  listCustomers,
  listCustomersSchemas,
  restoreCustomer,
  updateCustomer,
  updateCustomerSchemas,
} from '../controllers/customer.controller';
import { noStore } from '../middleware/no-store';
import { validate } from '../middleware/validate';

/** Owners and staff both manage customers. */
export function createCustomersRouter({ requireAuth }: { requireAuth: RequestHandler }): Router {
  const router = Router();
  router.use(noStore, requireAuth);

  router.get('/', validate(listCustomersSchemas), listCustomers);
  router.post('/', validate(createCustomerSchemas), createCustomer);
  router.get('/:id', validate(customerIdSchemas), getCustomer);
  router.patch('/:id', validate(updateCustomerSchemas), updateCustomer);
  router.post('/:id/archive', validate(customerIdSchemas), archiveCustomer);
  router.post('/:id/restore', validate(customerIdSchemas), restoreCustomer);
  return router;
}

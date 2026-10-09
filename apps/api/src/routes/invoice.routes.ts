import { type RequestHandler, Router } from 'express';
import {
  cancelInvoice,
  createInvoice,
  createInvoiceSchemas,
  deleteInvoice,
  deletePayment,
  getInvoice,
  invoiceIdSchemas,
  listInvoices,
  listInvoicesSchemas,
  paymentIdSchemas,
  recordPayment,
  recordPaymentSchemas,
  sendInvoice,
  updateInvoice,
  updateInvoiceSchemas,
} from '../controllers/invoice.controller';
import { noStore } from '../middleware/no-store';
import { validate } from '../middleware/validate';

/**
 * Business-side invoices. The PDF route (GET /:id/pdf) is mounted at /invoices
 * by its own router; the guard below also runs for its requests, which is
 * harmless because it requires the same authentication.
 */
export function createInvoiceRouter({ requireAuth }: { requireAuth: RequestHandler }): Router {
  const router = Router();
  router.use(noStore, requireAuth);

  router.get('/', validate(listInvoicesSchemas), listInvoices);
  router.post('/', validate(createInvoiceSchemas), createInvoice);
  router.get('/:id', validate(invoiceIdSchemas), getInvoice);
  router.put('/:id', validate(updateInvoiceSchemas), updateInvoice);
  router.delete('/:id', validate(invoiceIdSchemas), deleteInvoice);
  router.post('/:id/send', validate(invoiceIdSchemas), sendInvoice);
  router.post('/:id/payments', validate(recordPaymentSchemas), recordPayment);
  router.delete('/:id/payments/:paymentId', validate(paymentIdSchemas), deletePayment);
  router.post('/:id/cancel', validate(invoiceIdSchemas), cancelInvoice);
  return router;
}

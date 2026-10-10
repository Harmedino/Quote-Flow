import type {
  InvoiceDto,
  InvoiceInput,
  InvoiceListItemDto,
  PaginationMeta,
  QuoteDto,
} from '@quoteflow/shared';
import { addDaysToIsoDate, todayInTimeZone } from '@quoteflow/shared';
import type { Express } from 'express';
import { Types } from 'mongoose';
import request from 'supertest';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { BusinessModel, CustomerModel, InvoiceModel, QuoteModel, ServiceModel } from '../models';
import { bearer, createAuthTestApp, registerOwner } from '../test/auth';
import { TEST_DATABASE_URI, isUnsupportedIndexOption, useTestDatabase } from '../test/database';
import { dataOf, errorOf } from '../test/helpers';
import { quoteInput } from '../test/model-fixtures';

interface Owner {
  token: string;
  businessId: string;
  userId: string;
  customerId: string;
  serviceId: string;
}

const PAST_ISSUE = '2020-01-01';
const PAST_DUE = '2020-01-31';

describe.skipIf(!TEST_DATABASE_URI)('invoice routes (database)', () => {
  const database = useTestDatabase();
  let app: Express;

  beforeAll(() => {
    app = createAuthTestApp();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const api = (owner: Owner) => ({
    get: (path: string) =>
      request(app).get(`/api${path}`).set('Authorization', bearer(owner.token)),
    post: (path: string, body?: object) =>
      request(app)
        .post(`/api${path}`)
        .set('Authorization', bearer(owner.token))
        .send(body ?? {}),
    put: (path: string, body: object) =>
      request(app).put(`/api${path}`).set('Authorization', bearer(owner.token)).send(body),
    delete: (path: string) =>
      request(app).delete(`/api${path}`).set('Authorization', bearer(owner.token)),
  });

  async function newOwner(): Promise<Owner> {
    const { session } = await registerOwner(app);
    const businessId = session.business.id;
    await BusinessModel.updateOne(
      { _id: businessId },
      {
        $set: {
          invoiceDueDays: 10,
          defaultTaxRate: 5,
          defaultInvoiceNotes: 'Pay by bank transfer.',
        },
      },
    );
    const customer = await CustomerModel.create({
      businessId,
      name: 'Olivia Harper',
      email: 'olivia@example.com',
      phone: '+1 555 010 1234',
    });
    const service = await ServiceModel.create({
      businessId,
      name: 'Deep cleaning',
      price: 5_500,
      unit: 'hour',
    });
    return {
      token: session.accessToken,
      businessId,
      userId: session.user.id,
      customerId: customer._id.toString(),
      serviceId: service._id.toString(),
    };
  }

  function draftInput(owner: Owner, overrides: Partial<InvoiceInput> = {}): InvoiceInput {
    return {
      customerId: owner.customerId,
      items: [{ serviceId: owner.serviceId, name: 'Deep cleaning', quantity: 2, unitPrice: 5_000 }],
      ...overrides,
    };
  }

  async function createDraft(owner: Owner, overrides: Partial<InvoiceInput> = {}) {
    const res = await api(owner).post('/invoices', draftInput(owner, overrides)).expect(201);
    return dataOf<InvoiceDto>(res);
  }

  async function createSent(owner: Owner, overrides: Partial<InvoiceInput> = {}) {
    const draft = await createDraft(owner, overrides);
    const res = await api(owner).post(`/invoices/${draft.id}/send`).expect(200);
    return dataOf<InvoiceDto>(res);
  }

  async function acceptedQuote(owner: Owner, overrides: Record<string, unknown> = {}) {
    return QuoteModel.create(
      quoteInput({
        businessId: owner.businessId,
        customerId: owner.customerId,
        createdBy: owner.userId,
        quoteNumber: `QT-${new Types.ObjectId().toHexString().slice(-6)}`,
        status: 'accepted',
        acceptedAt: new Date(),
        expiryDate: new Date('2099-01-01T00:00:00.000Z'),
        items: [
          {
            serviceId: owner.serviceId,
            name: 'Deep cleaning',
            description: 'Kitchen and bathrooms',
            quantity: 2.5,
            unit: 'hour',
            unitPrice: 5_500,
          },
        ],
        discount: { type: 'percentage', value: 10 },
        taxRate: 8.25,
        notes: 'Quote notes',
        terms: 'Quote terms',
        ...overrides,
      }),
    );
  }

  describe('POST /quotes/:id/convert', () => {
    it('creates a draft invoice that copies the quote and links the quote to it', async () => {
      const owner = await newOwner();
      const quote = await acceptedQuote(owner);
      const before = await QuoteModel.findOne({
        _id: quote._id,
        businessId: owner.businessId,
      }).lean();

      const res = await api(owner).post(`/quotes/${quote._id.toString()}/convert`);

      expect(res.status).toBe(201);
      const invoice = dataOf<InvoiceDto>(res);
      const today = todayInTimeZone('UTC');
      expect(invoice).toMatchObject({
        invoiceNumber: 'INV-0001',
        status: 'draft',
        quoteId: quote._id.toString(),
        customerId: owner.customerId,
        customer: { name: 'Olivia Harper', email: 'olivia.harper@example.com' },
        currency: quote.currency,
        items: [
          {
            serviceId: owner.serviceId,
            name: 'Deep cleaning',
            description: 'Kitchen and bathrooms',
            quantity: 2.5,
            unit: 'hour',
            unitPrice: 5_500,
            amount: 13_750,
          },
        ],
        discount: { type: 'percentage', value: 10 },
        taxRate: 8.25,
        totals: { subtotal: 13_750, discount: 1_375, tax: 1_021, total: 13_396 },
        amountPaid: 0,
        balanceDue: 13_396,
        payments: [],
        // Business defaults win over the quote's notes; the quote's terms fill the gap.
        notes: 'Pay by bank transfer.',
        terms: 'Quote terms',
        sentAt: null,
      });
      // The business time zone defaults to one close to UTC in tests; allow a day either way.
      expect([addDaysToIsoDate(today, -1), today, addDaysToIsoDate(today, 1)]).toContain(
        invoice.issueDate,
      );
      expect(invoice.dueDate).toBe(addDaysToIsoDate(invoice.issueDate, 10));
      expect(invoice.publicToken).toMatch(/^[A-Za-z0-9_-]{43}$/);

      const after = await QuoteModel.findOne({
        _id: quote._id,
        businessId: owner.businessId,
      }).lean();
      expect(after?.invoiceId?.toString()).toBe(invoice.id);
      expect(after?.convertedAt).toBeInstanceOf(Date);
      // Only the link (and the bookkeeping that comes with any write) may change.
      const strip = (doc: typeof before) => {
        const {
          invoiceId: _invoiceId,
          convertedAt: _convertedAt,
          updatedAt: _updatedAt,
          __v: _version,
          ...rest
        } = doc as unknown as Record<string, unknown>;
        return rest;
      };
      expect(strip(after)).toEqual(strip(before));

      const quoteRes = await api(owner).get(`/quotes/${quote._id.toString()}`);
      if (quoteRes.status === 200) {
        expect(dataOf<{ invoiceId: string | null }>(quoteRes).invoiceId).toBe(invoice.id);
      }
    });

    it('numbers converted and standalone invoices from one sequence', async () => {
      const owner = await newOwner();
      await createDraft(owner);
      const quote = await acceptedQuote(owner);
      const res = await api(owner).post(`/quotes/${quote._id.toString()}/convert`).expect(201);
      expect(dataOf<InvoiceDto>(res).invoiceNumber).toBe('INV-0002');
    });

    it.each(['draft', 'sent', 'viewed', 'rejected', 'expired'])(
      'rejects a %s quote with 409',
      async (status) => {
        const owner = await newOwner();
        const quote = await acceptedQuote(owner, { status });
        const res = await api(owner).post(`/quotes/${quote._id.toString()}/convert`);
        expect(res.status).toBe(409);
        expect(errorOf(res).message).toBe('Only accepted quotes can be converted');
        expect(await InvoiceModel.countDocuments({ businessId: owner.businessId })).toBe(0);
      },
    );

    it('converts a quote only once when asked twice in a row', async () => {
      const owner = await newOwner();
      const quote = await acceptedQuote(owner);
      await api(owner).post(`/quotes/${quote._id.toString()}/convert`).expect(201);

      const again = await api(owner).post(`/quotes/${quote._id.toString()}/convert`);
      expect(again.status).toBe(409);
      expect(errorOf(again).message).toBe('This quote has already been converted to an invoice');
      expect(await InvoiceModel.countDocuments({ businessId: owner.businessId })).toBe(1);
    });

    it('converts a quote again once its draft invoice is deleted', async () => {
      const owner = await newOwner();
      const quote = await acceptedQuote(owner);
      const convert = () => api(owner).post(`/quotes/${quote._id.toString()}/convert`);
      const first = dataOf<InvoiceDto>(await convert().expect(201));

      await api(owner).delete(`/invoices/${first.id}`).expect(204);

      const released = await QuoteModel.findOne({
        _id: quote._id,
        businessId: owner.businessId,
      }).lean();
      expect(released).not.toHaveProperty('invoiceId');
      expect(released).not.toHaveProperty('convertedAt');
      const second = dataOf<InvoiceDto>(await convert().expect(201));
      expect(second).toMatchObject({ quoteId: quote._id.toString(), status: 'draft' });
      expect(second.id).not.toBe(first.id);
      const relinked = await QuoteModel.findOne({ _id: quote._id, businessId: owner.businessId });
      expect(relinked?.invoiceId?.toString()).toBe(second.id);

      const third = await convert();
      expect(third.status).toBe(409);
      expect(errorOf(third).message).toBe('This quote has already been converted to an invoice');
      expect(await InvoiceModel.countDocuments({ businessId: owner.businessId })).toBe(1);
    });

    it('keeps a quote converted while its invoice is live', async () => {
      const owner = await newOwner();
      const quote = await acceptedQuote(owner);
      const res = await api(owner).post(`/quotes/${quote._id.toString()}/convert`).expect(201);
      const invoice = dataOf<InvoiceDto>(res);
      await api(owner).post(`/invoices/${invoice.id}/send`).expect(200);

      await api(owner).delete(`/invoices/${invoice.id}`).expect(409);

      await api(owner).post(`/quotes/${quote._id.toString()}/convert`).expect(409);
      const linked = await QuoteModel.findOne({ _id: quote._id, businessId: owner.businessId });
      expect(linked?.invoiceId?.toString()).toBe(invoice.id);
    });

    it('does not delete a draft that was sent while it was being deleted', async () => {
      const owner = await newOwner();
      const quote = await acceptedQuote(owner);
      const res = await api(owner).post(`/quotes/${quote._id.toString()}/convert`).expect(201);
      const invoice = dataOf<InvoiceDto>(res);
      // Another request sends the invoice between the delete's status check and its delete.
      const deleteOne = InvoiceModel.deleteOne.bind(InvoiceModel);
      vi.spyOn(InvoiceModel, 'deleteOne').mockImplementationOnce(((
        ...args: Parameters<typeof deleteOne>
      ) =>
        api(owner)
          .post(`/invoices/${invoice.id}/send`)
          .expect(200)
          .then(() => deleteOne(...args))) as unknown as typeof InvoiceModel.deleteOne);

      const deletion = await api(owner).delete(`/invoices/${invoice.id}`);

      expect(deletion.status).toBe(409);
      expect(
        await InvoiceModel.findOne({ _id: invoice.id, businessId: owner.businessId }),
      ).toMatchObject({ status: 'sent' });
      const linked = await QuoteModel.findOne({ _id: quote._id, businessId: owner.businessId });
      expect(linked?.invoiceId?.toString()).toBe(invoice.id);
    });

    it('releases a quote whose invoice was deleted without releasing it', async () => {
      const owner = await newOwner();
      const quote = await acceptedQuote(owner);
      const res = await api(owner).post(`/quotes/${quote._id.toString()}/convert`).expect(201);
      // As deletions did before they released the quote, or one that stopped halfway.
      await InvoiceModel.deleteOne({
        _id: dataOf<InvoiceDto>(res).id,
        businessId: owner.businessId,
      });

      const again = await api(owner).post(`/quotes/${quote._id.toString()}/convert`).expect(201);

      const relinked = await QuoteModel.findOne({ _id: quote._id, businessId: owner.businessId });
      expect(relinked?.invoiceId?.toString()).toBe(dataOf<InvoiceDto>(again).id);
    });

    it('shows a quote whose invoice was deleted without releasing it as convertible', async () => {
      const owner = await newOwner();
      const quote = await acceptedQuote(owner);
      const res = await api(owner).post(`/quotes/${quote._id.toString()}/convert`).expect(201);
      await InvoiceModel.deleteOne({
        _id: dataOf<InvoiceDto>(res).id,
        businessId: owner.businessId,
      });

      const opened = dataOf<QuoteDto>(
        await api(owner).get(`/quotes/${quote._id.toString()}`).expect(200),
      );

      expect(opened).toMatchObject({ invoiceId: null, convertedAt: null });
      const released = await QuoteModel.findOne({
        _id: quote._id,
        businessId: owner.businessId,
      }).lean();
      expect(released).not.toHaveProperty('invoiceId');
    });

    it('reports a draft deleted by a concurrent request as not found', async () => {
      const owner = await newOwner();
      const quote = await acceptedQuote(owner);
      const res = await api(owner).post(`/quotes/${quote._id.toString()}/convert`).expect(201);
      const invoice = dataOf<InvoiceDto>(res);
      // Another request deletes the draft between this delete's status check and its delete.
      const deleteOne = InvoiceModel.deleteOne.bind(InvoiceModel);
      vi.spyOn(InvoiceModel, 'deleteOne').mockImplementationOnce(((
        ...args: Parameters<typeof deleteOne>
      ) =>
        api(owner)
          .delete(`/invoices/${invoice.id}`)
          .expect(204)
          .then(() => deleteOne(...args))) as unknown as typeof InvoiceModel.deleteOne);

      const deletion = await api(owner).delete(`/invoices/${invoice.id}`);

      expect(deletion.status).toBe(404);
      await api(owner).post(`/quotes/${quote._id.toString()}/convert`).expect(201);
    });

    it('re-links a quote whose earlier conversion stopped before linking it', async () => {
      const owner = await newOwner();
      const quote = await acceptedQuote(owner);
      const res = await api(owner).post(`/quotes/${quote._id.toString()}/convert`).expect(201);
      await QuoteModel.updateOne(
        { _id: quote._id, businessId: owner.businessId },
        { $unset: { invoiceId: 1, convertedAt: 1 } },
      ).setOptions({ allowAtomicUpdate: true });

      const again = await api(owner).post(`/quotes/${quote._id.toString()}/convert`);
      expect(again.status).toBe(409);
      const relinked = await QuoteModel.findOne({ _id: quote._id, businessId: owner.businessId });
      expect(relinked?.invoiceId?.toString()).toBe(dataOf<InvoiceDto>(res).id);
      expect(await InvoiceModel.countDocuments({ businessId: owner.businessId })).toBe(1);
    });

    it('creates exactly one invoice when converted concurrently', async (context) => {
      const report = database.indexReports().find((r) => r.model === InvoiceModel.modelName);
      context.skip(
        isUnsupportedIndexOption(report),
        'This MongoDB stand-in does not implement partial indexes; run against MongoDB to cover this.',
      );
      const owner = await newOwner();
      const quote = await acceptedQuote(owner);

      const results = await Promise.all(
        Array.from({ length: 5 }, () => api(owner).post(`/quotes/${quote._id.toString()}/convert`)),
      );

      expect(results.map((res) => res.status).sort()).toEqual([201, 409, 409, 409, 409]);
      const invoices = await InvoiceModel.find({ businessId: owner.businessId }).lean();
      expect(invoices).toHaveLength(1);
      const linked = await QuoteModel.findOne({ _id: quote._id, businessId: owner.businessId });
      expect(linked?.invoiceId?.toString()).toBe(invoices[0]?._id.toString());
    });

    it("returns 404 for another business's quote and an unknown one", async () => {
      const owner = await newOwner();
      const other = await newOwner();
      const quote = await acceptedQuote(other);

      await api(owner).post(`/quotes/${quote._id.toString()}/convert`).expect(404);
      await api(owner).post(`/quotes/${new Types.ObjectId().toString()}/convert`).expect(404);
      expect(await InvoiceModel.countDocuments({ businessId: other.businessId })).toBe(0);
    });

    it('requires authentication', async () => {
      await request(app).post(`/api/quotes/${new Types.ObjectId().toString()}/convert`).expect(401);
    });
  });

  describe('standalone invoices', () => {
    it('creates a draft with the business defaults', async () => {
      const owner = await newOwner();
      const invoice = await createDraft(owner);
      expect(invoice).toMatchObject({
        invoiceNumber: 'INV-0001',
        status: 'draft',
        quoteId: null,
        taxRate: 5,
        notes: 'Pay by bank transfer.',
        terms: null,
        totals: { subtotal: 10_000, discount: 0, tax: 500, total: 10_500 },
        balanceDue: 10_500,
        customer: { name: 'Olivia Harper', phone: '+1 555 010 1234' },
      });
      expect(invoice.dueDate).toBe(addDaysToIsoDate(invoice.issueDate, 10));
    });

    it('validates the customer, services and dates', async () => {
      const owner = await newOwner();
      const other = await newOwner();

      const foreignCustomer = await api(owner).post(
        '/invoices',
        draftInput(owner, { customerId: other.customerId }),
      );
      expect(foreignCustomer.status).toBe(400);
      expect(errorOf(foreignCustomer).details?.[0]?.path).toBe('customerId');

      await CustomerModel.updateOne(
        { _id: owner.customerId, businessId: owner.businessId },
        { $set: { archivedAt: new Date() } },
      );
      const archived = await api(owner).post('/invoices', draftInput(owner));
      expect(archived.status).toBe(400);
      expect(errorOf(archived).details?.[0]?.path).toBe('customerId');
      await CustomerModel.updateOne(
        { _id: owner.customerId, businessId: owner.businessId },
        { $set: { archivedAt: null } },
      );

      const foreignService = await api(owner).post(
        '/invoices',
        draftInput(owner, {
          items: [{ serviceId: other.serviceId, name: 'X', quantity: 1, unitPrice: 100 }],
        }),
      );
      expect(foreignService.status).toBe(400);
      expect(errorOf(foreignService).details?.[0]?.path).toBe('items.0.serviceId');

      const backwards = await api(owner).post(
        '/invoices',
        draftInput(owner, { issueDate: '2026-05-10', dueDate: '2026-05-01' }),
      );
      expect(backwards.status).toBe(400);
      expect(errorOf(backwards).details?.[0]?.path).toBe('dueDate');
    });

    it('edits and deletes drafts only', async () => {
      const owner = await newOwner();
      const draft = await createDraft(owner);

      const edited = await api(owner)
        .put(`/invoices/${draft.id}`, {
          ...draftInput(owner),
          items: [{ name: 'Window cleaning', quantity: 3, unitPrice: 2_000 }],
          discount: { type: 'fixed', value: 1_000 },
          taxRate: 0,
          notes: '',
          dueDate: addDaysToIsoDate(draft.issueDate, 30),
        })
        .expect(200);
      expect(dataOf<InvoiceDto>(edited)).toMatchObject({
        items: [{ name: 'Window cleaning', serviceId: null, amount: 6_000 }],
        totals: { subtotal: 6_000, discount: 1_000, tax: 0, total: 5_000 },
        notes: null,
        invoiceNumber: draft.invoiceNumber,
        dueDate: addDaysToIsoDate(draft.issueDate, 30),
      });

      await api(owner).post(`/invoices/${draft.id}/send`).expect(200);
      const editSent = await api(owner).put(`/invoices/${draft.id}`, draftInput(owner));
      expect(editSent.status).toBe(409);
      expect((await api(owner).delete(`/invoices/${draft.id}`)).status).toBe(409);

      const another = await createDraft(owner);
      await api(owner).delete(`/invoices/${another.id}`).expect(204);
      await api(owner).get(`/invoices/${another.id}`).expect(404);
    });

    it('marks a draft as sent once and keeps the first sent time', async () => {
      const owner = await newOwner();
      const sent = await createSent(owner);
      expect(sent.status).toBe('sent');
      expect(sent.sentAt).not.toBeNull();

      const again = dataOf<InvoiceDto>(
        await api(owner).post(`/invoices/${sent.id}/send`).expect(200),
      );
      expect(again.sentAt).toBe(sent.sentAt);
    });
  });

  describe('payments', () => {
    it('tracks partial and full payments and recomputes when one is deleted', async () => {
      const owner = await newOwner();
      const invoice = await createSent(owner);
      const total = invoice.totals.total;

      const partial = await api(owner).post(`/invoices/${invoice.id}/payments`, {
        amount: 4_000,
        method: 'cash',
        reference: 'R-1',
      });
      expect(partial.status).toBe(201);
      expect(dataOf<InvoiceDto>(partial)).toMatchObject({
        status: 'partially_paid',
        amountPaid: 4_000,
        balanceDue: total - 4_000,
        paidAt: null,
        payments: [{ amount: 4_000, method: 'cash', reference: 'R-1', note: null }],
      });

      const over = await api(owner).post(`/invoices/${invoice.id}/payments`, {
        amount: total,
        method: 'card',
      });
      expect(over.status).toBe(400);
      expect(errorOf(over)).toMatchObject({
        code: 'VALIDATION_ERROR',
        details: [{ path: 'amount', message: 'Payment exceeds the balance due' }],
      });

      const full = await api(owner).post(`/invoices/${invoice.id}/payments`, {
        amount: total - 4_000,
        method: 'bank_transfer',
        paidAt: '2026-01-02',
      });
      const paid = dataOf<InvoiceDto>(full);
      expect(paid).toMatchObject({ status: 'paid', amountPaid: total, balanceDue: 0 });
      expect(paid.paidAt).not.toBeNull();

      const closed = await api(owner).post(`/invoices/${invoice.id}/payments`, {
        amount: 1,
        method: 'cash',
      });
      expect(closed.status).toBe(409);
      expect((await api(owner).post(`/invoices/${invoice.id}/cancel`)).status).toBe(409);

      const lastPayment = paid.payments[1];
      if (!lastPayment) throw new Error('payment is missing');
      const reopened = dataOf<InvoiceDto>(
        await api(owner).delete(`/invoices/${invoice.id}/payments/${lastPayment.id}`).expect(200),
      );
      expect(reopened).toMatchObject({
        status: 'partially_paid',
        amountPaid: 4_000,
        paidAt: null,
      });

      const firstPayment = reopened.payments[0];
      if (!firstPayment) throw new Error('payment is missing');
      const unpaid = dataOf<InvoiceDto>(
        await api(owner).delete(`/invoices/${invoice.id}/payments/${firstPayment.id}`).expect(200),
      );
      expect(unpaid).toMatchObject({ status: 'sent', amountPaid: 0, payments: [] });

      await api(owner).delete(`/invoices/${invoice.id}/payments/${firstPayment.id}`).expect(404);
    });

    it('refuses payments on drafts and future-dated payments', async () => {
      const owner = await newOwner();
      const draft = await createDraft(owner);
      const res = await api(owner).post(`/invoices/${draft.id}/payments`, {
        amount: 100,
        method: 'cash',
      });
      expect(res.status).toBe(409);

      await api(owner).post(`/invoices/${draft.id}/send`).expect(200);
      const future = await api(owner).post(`/invoices/${draft.id}/payments`, {
        amount: 100,
        method: 'cash',
        paidAt: '2099-01-01',
      });
      expect(future.status).toBe(400);
      expect(errorOf(future).details?.[0]?.path).toBe('paidAt');
    });
  });

  describe('cancelling', () => {
    it('cancels unpaid invoices but not ones with payments', async () => {
      const owner = await newOwner();
      const invoice = await createSent(owner);
      const withPayment = await createSent(owner);
      await api(owner)
        .post(`/invoices/${withPayment.id}/payments`, { amount: 100, method: 'cash' })
        .expect(201);

      const blocked = await api(owner).post(`/invoices/${withPayment.id}/cancel`);
      expect(blocked.status).toBe(409);
      expect(errorOf(blocked).message).toMatch(/Delete the payments first/);

      const cancelled = dataOf<InvoiceDto>(
        await api(owner).post(`/invoices/${invoice.id}/cancel`).expect(200),
      );
      expect(cancelled.status).toBe('cancelled');
      expect(cancelled.cancelledAt).not.toBeNull();

      expect((await api(owner).post(`/invoices/${invoice.id}/cancel`)).status).toBe(409);
      expect((await api(owner).post(`/invoices/${invoice.id}/send`)).status).toBe(409);
      const payment = await api(owner).post(`/invoices/${invoice.id}/payments`, {
        amount: 100,
        method: 'cash',
      });
      expect(payment.status).toBe(409);
    });
  });

  describe('GET /invoices', () => {
    it('reports past-due invoices as overdue and filters by effective status', async () => {
      const owner = await newOwner();
      const overdue = await createSent(owner, { issueDate: PAST_ISSUE, dueDate: PAST_DUE });
      const partOverdue = await createSent(owner, { issueDate: PAST_ISSUE, dueDate: PAST_DUE });
      await api(owner)
        .post(`/invoices/${partOverdue.id}/payments`, { amount: 100, method: 'cash' })
        .expect(201);
      const current = await createSent(owner);
      const draft = await createDraft(owner, { issueDate: PAST_ISSUE, dueDate: PAST_DUE });

      expect(overdue.status).toBe('overdue');
      expect(draft.status).toBe('draft');

      const ids = async (query: string) => {
        const res = await api(owner).get(`/invoices${query}`).expect(200);
        return dataOf<InvoiceListItemDto[]>(res).map((invoice) => invoice.id);
      };
      expect(new Set(await ids('?status=overdue'))).toEqual(new Set([overdue.id, partOverdue.id]));
      expect(await ids('?status=sent')).toEqual([current.id]);
      expect(await ids('?status=partially_paid')).toEqual([]);
      expect(await ids('?status=draft')).toEqual([draft.id]);
      expect(await ids('')).toEqual([draft.id, current.id, partOverdue.id, overdue.id]);

      const list = await api(owner).get('/invoices?status=overdue').expect(200);
      const items = dataOf<InvoiceListItemDto[]>(list);
      expect(items.every((item) => item.status === 'overdue')).toBe(true);
      expect(items.find((item) => item.id === partOverdue.id)).toMatchObject({
        customerName: 'Olivia Harper',
        total: partOverdue.totals.total,
        balanceDue: partOverdue.totals.total - 100,
        dueDate: PAST_DUE,
      });
    });

    it('searches by number or customer name, literally, and paginates', async () => {
      const owner = await newOwner();
      const first = await createDraft(owner);
      await createDraft(owner);
      const third = await createDraft(owner);

      const byNumber = await api(owner).get('/invoices?search=inv-0003').expect(200);
      expect(dataOf<InvoiceListItemDto[]>(byNumber).map((i) => i.id)).toEqual([third.id]);

      const byName = await api(owner).get('/invoices?search=harper').expect(200);
      expect(dataOf<InvoiceListItemDto[]>(byName)).toHaveLength(3);

      const literal = await api(owner).get('/invoices?search=.*').expect(200);
      expect(dataOf<InvoiceListItemDto[]>(literal)).toHaveLength(0);

      const page = await api(owner).get('/invoices?page=2&pageSize=2').expect(200);
      expect(dataOf<InvoiceListItemDto[]>(page).map((i) => i.id)).toEqual([first.id]);
      expect((page.body as { meta: PaginationMeta }).meta).toEqual({
        page: 2,
        pageSize: 2,
        total: 3,
        totalPages: 2,
      });

      const byCustomer = await api(owner)
        .get(`/invoices?customerId=${new Types.ObjectId().toString()}`)
        .expect(200);
      expect(dataOf<InvoiceListItemDto[]>(byCustomer)).toHaveLength(0);
    });
  });

  describe('tenant isolation', () => {
    it("never reads or changes another business's invoices", async () => {
      const owner = await newOwner();
      const intruder = await newOwner();
      const invoice = await createSent(owner);
      const path = `/invoices/${invoice.id}`;

      await api(intruder).get(path).expect(404);
      await api(intruder).put(path, draftInput(intruder)).expect(404);
      await api(intruder).delete(path).expect(404);
      await api(intruder).post(`${path}/send`).expect(404);
      await api(intruder).post(`${path}/payments`, { amount: 100, method: 'cash' }).expect(404);
      await api(intruder).post(`${path}/cancel`).expect(404);
      const list = await api(intruder).get('/invoices').expect(200);
      expect(dataOf<InvoiceListItemDto[]>(list)).toEqual([]);

      const unchanged = dataOf<InvoiceDto>(await api(owner).get(path).expect(200));
      expect(unchanged).toMatchObject({ status: 'sent', payments: [] });
    });

    it('requires authentication', async () => {
      await request(app).get('/api/invoices').expect(401);
    });
  });
});

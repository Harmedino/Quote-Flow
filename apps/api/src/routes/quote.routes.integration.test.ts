import {
  type PublicQuoteDto,
  type QuoteDto,
  type QuoteInput,
  type QuoteListItemDto,
  type QuoteStatus,
  addDaysToIsoDate,
  isoDateToUtcDate,
  todayInTimeZone,
} from '@quoteflow/shared';
import type { Express } from 'express';
import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';
import { BusinessModel, CustomerModel, QuoteModel, ServiceModel } from '../models';
import { bearer, createAuthTestApp, registerOwner } from '../test/auth';
import { TEST_DATABASE_URI, useTestDatabase } from '../test/database';
import { dataOf, errorOf } from '../test/helpers';

interface Tenant {
  token: string;
  businessId: string;
  customerId: string;
  serviceId: string;
}

const TIME_ZONE = 'Africa/Lagos';
const today = () => todayInTimeZone(TIME_ZONE);

describe.skipIf(!TEST_DATABASE_URI)('quote routes (database)', () => {
  useTestDatabase();
  let app: Express;

  beforeAll(() => {
    app = createAuthTestApp();
  });

  async function createTenant(): Promise<Tenant> {
    const { session } = await registerOwner(app);
    const businessId = session.business.id;
    await BusinessModel.updateOne(
      { _id: businessId },
      {
        currency: 'NGN',
        timezone: TIME_ZONE,
        quotePrefix: 'SPK',
        quoteValidityDays: 10,
        defaultTaxRate: 7.5,
        defaultQuoteNotes: 'Thanks for choosing us.',
        defaultQuoteTerms: '50% deposit to book.',
      },
    );
    const customer = await CustomerModel.create({
      businessId,
      name: 'Chidi Okafor',
      email: 'chidi@example.com',
      phone: '+234 803 555 0101',
      address: { city: 'Lagos' },
    });
    const service = await ServiceModel.create({
      businessId,
      name: 'Deep cleaning',
      price: 2_500_000,
      unit: 'visit',
    });
    return {
      token: session.accessToken,
      businessId,
      customerId: customer.id,
      serviceId: service.id,
    };
  }

  const auth = (tenant: Tenant) => bearer(tenant.token);

  function quoteInput(tenant: Tenant, overrides: Partial<QuoteInput> = {}): QuoteInput {
    return {
      customerId: tenant.customerId,
      items: [
        { serviceId: tenant.serviceId, name: 'Deep cleaning', quantity: 2, unitPrice: 2_500_000 },
        { name: 'Window washing', description: 'Outside only', quantity: 1.5, unitPrice: 1_000 },
      ],
      ...overrides,
    };
  }

  async function createQuote(tenant: Tenant, overrides: Partial<QuoteInput> = {}) {
    const res = await request(app)
      .post('/api/quotes')
      .set('Authorization', auth(tenant))
      .send(quoteInput(tenant, overrides))
      .expect(201);
    return dataOf<QuoteDto>(res);
  }

  async function setStored(id: string, fields: Record<string, unknown>) {
    const quote = await QuoteModel.findById(id).setOptions({ skipTenantGuard: true });
    if (!quote) throw new Error('quote not found');
    await QuoteModel.updateOne({ _id: id, businessId: quote.businessId }, fields).setOptions({
      allowAtomicUpdate: true,
    });
  }

  /** Moves a quote's dates into the past so it is (effectively) expired. */
  async function backdate(id: string, status: QuoteStatus) {
    await setStored(id, {
      status,
      issueDate: isoDateToUtcDate(addDaysToIsoDate(today(), -20)),
      expiryDate: isoDateToUtcDate(addDaysToIsoDate(today(), -5)),
    });
  }

  async function list(tenant: Tenant, query: Record<string, string | number> = {}) {
    const res = await request(app)
      .get('/api/quotes')
      .query(query)
      .set('Authorization', auth(tenant))
      .expect(200);
    return res.body as { data: QuoteListItemDto[]; meta: { total: number; totalPages: number } };
  }

  it('creates a draft with business defaults and server-calculated totals', async () => {
    const tenant = await createTenant();
    const res = await request(app)
      .post('/api/quotes')
      .set('Authorization', auth(tenant))
      .send({ ...quoteInput(tenant), totals: { subtotal: 1, discount: 0, tax: 0, total: 1 } });

    expect(res.status).toBe(201);
    expect(res.headers['cache-control']).toBe('no-store');
    const quote = dataOf<QuoteDto>(res);
    expect(quote).toMatchObject({
      quoteNumber: 'SPK-0001',
      status: 'draft',
      currency: 'NGN',
      customerId: tenant.customerId,
      customer: { name: 'Chidi Okafor', email: 'chidi@example.com', address: { city: 'Lagos' } },
      taxRate: 7.5,
      discount: null,
      notes: 'Thanks for choosing us.',
      terms: '50% deposit to book.',
      issueDate: today(),
      expiryDate: addDaysToIsoDate(today(), 10),
      sentAt: null,
      invoiceId: null,
    });
    expect(quote.publicToken).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(quote.items).toEqual([
      {
        serviceId: tenant.serviceId,
        name: 'Deep cleaning',
        description: null,
        quantity: 2,
        unit: null,
        unitPrice: 2_500_000,
        amount: 5_000_000,
      },
      {
        serviceId: null,
        name: 'Window washing',
        description: 'Outside only',
        quantity: 1.5,
        unit: null,
        unitPrice: 1_000,
        amount: 1_500,
      },
    ]);
    // 5,001,500 subtotal, 7.5% tax = 375,112.5 → 375,113 (half up).
    expect(quote.totals).toEqual({
      subtotal: 5_001_500,
      discount: 0,
      tax: 375_113,
      total: 5_376_613,
    });
  });

  it('applies discounts, explicit tax, dates and empty notes', async () => {
    const tenant = await createTenant();
    const issueDate = addDaysToIsoDate(today(), 1);
    const quote = await createQuote(tenant, {
      discount: { type: 'fixed', value: 1_500 },
      taxRate: 0,
      notes: '',
      issueDate,
    });
    expect(quote.totals).toEqual({
      subtotal: 5_001_500,
      discount: 1_500,
      tax: 0,
      total: 5_000_000,
    });
    expect(quote.notes).toBeNull();
    expect(quote.issueDate).toBe(issueDate);
    expect(quote.expiryDate).toBe(addDaysToIsoDate(issueDate, 10));
  });

  it('numbers quotes sequentially per business', async () => {
    const first = await createTenant();
    const second = await createTenant();
    expect((await createQuote(first)).quoteNumber).toBe('SPK-0001');
    expect((await createQuote(first)).quoteNumber).toBe('SPK-0002');
    expect((await createQuote(second)).quoteNumber).toBe('SPK-0001');
  });

  it('accepts service ids in upper case, as invoices do', async () => {
    const tenant = await createTenant();
    const items = [
      {
        serviceId: tenant.serviceId.toUpperCase(),
        name: 'Deep cleaning',
        quantity: 1,
        unitPrice: 1,
      },
    ];

    const created = await createQuote(tenant, { items });
    expect(created.items[0]?.serviceId).toBe(tenant.serviceId);

    const updated = await request(app)
      .put(`/api/quotes/${created.id}`)
      .set('Authorization', auth(tenant))
      .send(quoteInput(tenant, { items }))
      .expect(200);
    expect(dataOf<QuoteDto>(updated).items[0]?.serviceId).toBe(tenant.serviceId);
  });

  it('rejects invalid input, archived customers and foreign services', async () => {
    const tenant = await createTenant();
    const other = await createTenant();

    const invalid = await request(app)
      .post('/api/quotes')
      .set('Authorization', auth(tenant))
      .send(quoteInput(tenant, { items: [{ name: '', quantity: 0, unitPrice: -1 }] }));
    expect(invalid.status).toBe(400);
    expect(errorOf(invalid).details?.map((d) => d.path)).toEqual(
      expect.arrayContaining(['items.0.name', 'items.0.quantity', 'items.0.unitPrice']),
    );

    const foreignCustomer = await request(app)
      .post('/api/quotes')
      .set('Authorization', auth(tenant))
      .send(quoteInput(tenant, { customerId: other.customerId }));
    expect(foreignCustomer.status).toBe(400);
    expect(errorOf(foreignCustomer).details).toEqual([
      { path: 'customerId', message: 'Customer not found' },
    ]);

    await CustomerModel.updateOne(
      { _id: tenant.customerId, businessId: tenant.businessId },
      { archivedAt: new Date() },
    );
    const archived = await request(app)
      .post('/api/quotes')
      .set('Authorization', auth(tenant))
      .send(quoteInput(tenant));
    expect(archived.status).toBe(409);
    expect(errorOf(archived).details?.[0]?.path).toBe('customerId');

    const restored = await CustomerModel.create({ businessId: tenant.businessId, name: 'Ada' });
    const foreignService = await request(app)
      .post('/api/quotes')
      .set('Authorization', auth(tenant))
      .send(
        quoteInput(tenant, {
          customerId: restored.id,
          items: [{ serviceId: other.serviceId, name: 'Theirs', quantity: 1, unitPrice: 100 }],
        }),
      );
    expect(foreignService.status).toBe(400);
    expect(errorOf(foreignService).details).toEqual([
      { path: 'items.0.serviceId', message: 'Service not found' },
    ]);

    const badDates = await request(app)
      .post('/api/quotes')
      .set('Authorization', auth(tenant))
      .send(
        quoteInput(tenant, {
          customerId: restored.id,
          issueDate: '2026-05-10',
          expiryDate: '2026-05-01',
        }),
      );
    expect(badDates.status).toBe(400);
    expect(errorOf(badDates).details?.[0]?.path).toBe('expiryDate');
  });

  it('updates editable quotes, re-snapshotting a changed customer', async () => {
    const tenant = await createTenant();
    const quote = await createQuote(tenant);
    const newCustomer = await CustomerModel.create({
      businessId: tenant.businessId,
      name: 'Bola Ade',
      company: 'Ade Ventures',
    });

    const res = await request(app)
      .put(`/api/quotes/${quote.id}`)
      .set('Authorization', auth(tenant))
      .send({
        customerId: newCustomer.id,
        items: [{ name: 'Carpet shampoo', quantity: 3, unit: 'room', unitPrice: 10_000 }],
        discount: { type: 'percentage', value: 10 },
        taxRate: 5,
        terms: '',
      })
      .expect(200);
    const updated = dataOf<QuoteDto>(res);
    expect(updated).toMatchObject({
      id: quote.id,
      quoteNumber: quote.quoteNumber,
      customerId: newCustomer.id,
      customer: { name: 'Bola Ade', company: 'Ade Ventures' },
      discount: { type: 'percentage', value: 10 },
      taxRate: 5,
      notes: quote.notes,
      terms: null,
      publicToken: quote.publicToken,
      totals: { subtotal: 30_000, discount: 3_000, tax: 1_350, total: 28_350 },
    });

    await request(app).post(`/api/quotes/${quote.id}/send`).set('Authorization', auth(tenant));
    const whileSent = await request(app)
      .put(`/api/quotes/${quote.id}`)
      .set('Authorization', auth(tenant))
      .send(quoteInput(tenant, { customerId: newCustomer.id, discount: null }));
    expect(whileSent.status).toBe(200);
    expect(dataOf<QuoteDto>(whileSent)).toMatchObject({ status: 'sent', discount: null });

    // Once sent, its public link belongs to that customer: another one never sees it.
    const retargeted = await request(app)
      .put(`/api/quotes/${quote.id}`)
      .set('Authorization', auth(tenant))
      .send(quoteInput(tenant));
    expect(retargeted.status).toBe(409);
    expect(errorOf(retargeted).details).toEqual([
      { path: 'customerId', message: expect.stringContaining('duplicate it') as unknown },
    ]);
    const stored = await QuoteModel.findOne({ _id: quote.id, businessId: tenant.businessId });
    expect(stored?.customer.name).toBe('Bola Ade');

    for (const status of ['accepted', 'rejected'] as const) {
      await setStored(quote.id, { status });
      const refused = await request(app)
        .put(`/api/quotes/${quote.id}`)
        .set('Authorization', auth(tenant))
        .send(quoteInput(tenant, { customerId: newCustomer.id }));
      expect(refused.status).toBe(409);
      expect(errorOf(refused).code).toBe('CONFLICT');
    }
  });

  it('lets the customer answer only the version of a sent quote they last saw', async () => {
    const tenant = await createTenant();
    const quote = await createQuote(tenant);
    await request(app).post(`/api/quotes/${quote.id}/send`).set('Authorization', auth(tenant));
    const publicPath = `/api/public/quotes/${quote.publicToken}`;
    const seen = dataOf<PublicQuoteDto>(await request(app).get(publicPath).expect(200)).quote;

    const revised = await request(app)
      .put(`/api/quotes/${quote.id}`)
      .set('Authorization', auth(tenant))
      .send(
        quoteInput(tenant, {
          items: [{ name: 'Deep cleaning', quantity: 1, unitPrice: 9_999_900 }],
        }),
      )
      .expect(200);

    await request(app).post(`${publicPath}/accept`).send({ revision: seen.revision }).expect(409);
    const current = dataOf<PublicQuoteDto>(await request(app).get(publicPath).expect(200)).quote;
    expect(current.totals.total).toBe(dataOf<QuoteDto>(revised).totals.total);
    const accepted = await request(app)
      .post(`${publicPath}/accept`)
      .send({ revision: current.revision })
      .expect(200);
    expect(dataOf<PublicQuoteDto>(accepted).quote.totals).toEqual(current.totals);
  });

  it('revives an expired quote when it is revised with a future expiry date', async () => {
    const tenant = await createTenant();
    const stored = await createQuote(tenant);
    const lazy = await createQuote(tenant);
    await backdate(stored.id, 'expired');
    await backdate(lazy.id, 'viewed');

    const get = await request(app)
      .get(`/api/quotes/${lazy.id}`)
      .set('Authorization', auth(tenant))
      .expect(200);
    expect(dataOf<QuoteDto>(get).status).toBe('expired');

    const send = await request(app)
      .post(`/api/quotes/${stored.id}/send`)
      .set('Authorization', auth(tenant));
    expect(send.status).toBe(409);

    for (const [id, expected] of [
      [stored.id, 'sent'],
      [lazy.id, 'viewed'],
    ] as const) {
      const res = await request(app)
        .put(`/api/quotes/${id}`)
        .set('Authorization', auth(tenant))
        .send(quoteInput(tenant, { issueDate: today(), expiryDate: addDaysToIsoDate(today(), 7) }))
        .expect(200);
      expect(dataOf<QuoteDto>(res)).toMatchObject({
        status: expected,
        expiryDate: addDaysToIsoDate(today(), 7),
      });
    }
  });

  it('sends drafts once and keeps sending idempotent', async () => {
    const tenant = await createTenant();
    const quote = await createQuote(tenant);

    const first = dataOf<QuoteDto>(
      await request(app)
        .post(`/api/quotes/${quote.id}/send`)
        .set('Authorization', auth(tenant))
        .expect(200),
    );
    expect(first.status).toBe('sent');
    expect(first.sentAt).not.toBeNull();

    const again = dataOf<QuoteDto>(
      await request(app)
        .post(`/api/quotes/${quote.id}/send`)
        .set('Authorization', auth(tenant))
        .expect(200),
    );
    expect(again).toMatchObject({ status: 'sent', sentAt: first.sentAt });

    await setStored(quote.id, { status: 'viewed' });
    const viewed = await request(app)
      .post(`/api/quotes/${quote.id}/send`)
      .set('Authorization', auth(tenant))
      .expect(200);
    expect(dataOf<QuoteDto>(viewed).status).toBe('viewed');

    await setStored(quote.id, { status: 'accepted' });
    const accepted = await request(app)
      .post(`/api/quotes/${quote.id}/send`)
      .set('Authorization', auth(tenant));
    expect(accepted.status).toBe(409);
  });

  it('refuses to send a draft whose expiry date has already passed', async () => {
    const tenant = await createTenant();
    const quote = await createQuote(tenant, {
      issueDate: addDaysToIsoDate(today(), -20),
      expiryDate: addDaysToIsoDate(today(), -1),
    });
    expect(quote.status).toBe('draft');

    const send = await request(app)
      .post(`/api/quotes/${quote.id}/send`)
      .set('Authorization', auth(tenant));

    expect(send.status).toBe(409);
    expect(errorOf(send).message).toMatch(/expiry date has passed/);
    const stored = await request(app)
      .get(`/api/quotes/${quote.id}`)
      .set('Authorization', auth(tenant))
      .expect(200);
    expect(dataOf<QuoteDto>(stored)).toMatchObject({ status: 'draft', sentAt: null });
  });

  it('deletes drafts only', async () => {
    const tenant = await createTenant();
    const draft = await createQuote(tenant);
    const sent = await createQuote(tenant);
    await request(app).post(`/api/quotes/${sent.id}/send`).set('Authorization', auth(tenant));

    const refused = await request(app)
      .delete(`/api/quotes/${sent.id}`)
      .set('Authorization', auth(tenant));
    expect(refused.status).toBe(409);
    expect(errorOf(refused).message).toBe('Only draft quotes can be deleted.');

    await request(app)
      .delete(`/api/quotes/${draft.id}`)
      .set('Authorization', auth(tenant))
      .expect(204);
    await request(app)
      .get(`/api/quotes/${draft.id}`)
      .set('Authorization', auth(tenant))
      .expect(404);
  });

  it('duplicates a quote as a fresh draft for the current customer details', async () => {
    const tenant = await createTenant();
    const source = await createQuote(tenant, {
      discount: { type: 'percentage', value: 5 },
      taxRate: 2.5,
      notes: 'Bring ladders',
      terms: 'Cash only',
      issueDate: addDaysToIsoDate(today(), -3),
    });
    await request(app).post(`/api/quotes/${source.id}/send`).set('Authorization', auth(tenant));
    await CustomerModel.updateOne(
      { _id: tenant.customerId, businessId: tenant.businessId },
      { name: 'Chidi Okafor-Bello' },
    );

    const res = await request(app)
      .post(`/api/quotes/${source.id}/duplicate`)
      .set('Authorization', auth(tenant))
      .expect(201);
    const copy = dataOf<QuoteDto>(res);
    expect(copy.id).not.toBe(source.id);
    expect(copy.publicToken).not.toBe(source.publicToken);
    expect(copy).toMatchObject({
      quoteNumber: 'SPK-0002',
      status: 'draft',
      sentAt: null,
      customer: { name: 'Chidi Okafor-Bello' },
      items: source.items,
      discount: source.discount,
      taxRate: 2.5,
      notes: 'Bring ladders',
      terms: 'Cash only',
      totals: source.totals,
      issueDate: today(),
      expiryDate: addDaysToIsoDate(today(), 10),
    });
  });

  it('lists newest first with status filters that follow the effective status', async () => {
    const tenant = await createTenant();
    const draft = await createQuote(tenant);
    const sent = await createQuote(tenant);
    const lapsed = await createQuote(tenant);
    const expired = await createQuote(tenant);
    const accepted = await createQuote(tenant);
    await request(app).post(`/api/quotes/${sent.id}/send`).set('Authorization', auth(tenant));
    await backdate(lapsed.id, 'sent');
    await backdate(expired.id, 'expired');
    await setStored(accepted.id, { status: 'accepted' });

    const all = await list(tenant);
    expect(all.meta).toMatchObject({ total: 5, totalPages: 1 });
    expect(all.data.map((q) => q.id)).toEqual(
      [accepted, expired, lapsed, sent, draft].map((q) => q.id),
    );
    expect(all.data.find((q) => q.id === lapsed.id)).toMatchObject({
      status: 'expired',
      customerName: 'Chidi Okafor',
      total: sent.totals.total,
      currency: 'NGN',
      invoiceId: null,
    });

    const ids = async (status: string) => (await list(tenant, { status })).data.map((q) => q.id);
    expect(await ids('expired')).toEqual([expired.id, lapsed.id]);
    expect(await ids('sent')).toEqual([sent.id]);
    expect(await ids('draft')).toEqual([draft.id]);
    expect(await ids('accepted')).toEqual([accepted.id]);
    expect(await ids('viewed')).toEqual([]);

    const paged = await list(tenant, { page: 2, pageSize: 2 });
    expect(paged.meta).toMatchObject({ total: 5, totalPages: 3 });
    expect(paged.data.map((q) => q.id)).toEqual([lapsed.id, sent.id]);

    const invalid = await request(app)
      .get('/api/quotes')
      .query({ status: 'archived' })
      .set('Authorization', auth(tenant));
    expect(invalid.status).toBe(400);
  });

  it('filters by customer and searches number or customer name literally', async () => {
    const tenant = await createTenant();
    const other = await CustomerModel.create({
      businessId: tenant.businessId,
      name: 'A.C. (Repairs) Ltd*',
    });
    const forChidi = await createQuote(tenant);
    const forOther = await createQuote(tenant, { customerId: other.id });

    const byCustomer = await list(tenant, { customerId: other.id });
    expect(byCustomer.data.map((q) => q.id)).toEqual([forOther.id]);

    const search = async (term: string) =>
      (await list(tenant, { search: term })).data.map((q) => q.id);
    expect(await search('(repairs)')).toEqual([forOther.id]);
    expect(await search('ltd*')).toEqual([forOther.id]);
    expect(await search('.*')).toEqual([]);
    expect(await search('chidi')).toEqual([forChidi.id]);
    expect(await search('spk-0002')).toEqual([forOther.id]);
  });

  it('keeps every quote private to its business', async () => {
    const owner = await createTenant();
    const intruder = await createTenant();
    const quote = await createQuote(owner);
    await createQuote(intruder);

    expect((await list(intruder)).data.map((q) => q.id)).not.toContain(quote.id);
    const attempts = [
      request(app).get(`/api/quotes/${quote.id}`),
      request(app).put(`/api/quotes/${quote.id}`).send(quoteInput(intruder)),
      request(app).delete(`/api/quotes/${quote.id}`),
      request(app).post(`/api/quotes/${quote.id}/send`),
      request(app).post(`/api/quotes/${quote.id}/duplicate`),
    ];
    for (const attempt of attempts) {
      const res = await attempt.set('Authorization', auth(intruder));
      expect(res.status).toBe(404);
    }
    await request(app)
      .get('/api/quotes/0123456789abcdef01234567')
      .set('Authorization', auth(owner))
      .expect(404);
    await request(app).get('/api/quotes').expect(401);

    const untouched = await request(app)
      .get(`/api/quotes/${quote.id}`)
      .set('Authorization', auth(owner))
      .expect(200);
    expect(dataOf<QuoteDto>(untouched)).toMatchObject({ status: 'draft', id: quote.id });
  });
});

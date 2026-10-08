import type { CustomerDto } from '@quoteflow/shared';
import type { Express } from 'express';
import { Types } from 'mongoose';
import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';
import { addUser, bearer, createAuthTestApp, registerOwner } from '../test/auth';
import { TEST_DATABASE_URI, useTestDatabase } from '../test/database';
import { dataOf, errorOf } from '../test/helpers';

interface Page<T> {
  data: T[];
  meta: { page: number; pageSize: number; total: number; totalPages: number };
}

const FULL_CUSTOMER = {
  name: '  Grace Okafor ',
  email: 'Grace@Example.com',
  phone: '+1 (555) 010-1234',
  company: 'Okafor Dental',
  address: { line1: '4 Palm Ave', city: 'Austin', state: 'TX', postalCode: '78701', country: 'US' },
  notes: 'Prefers WhatsApp.',
};

describe.skipIf(!TEST_DATABASE_URI)('customer routes (database)', () => {
  useTestDatabase();

  let app: Express;
  let token: string;
  let otherToken: string;

  const api = (accessToken = token) => ({
    get: (path: string) =>
      request(app).get(`/api/customers${path}`).set('Authorization', bearer(accessToken)),
    post: (path: string, body?: object) =>
      request(app)
        .post(`/api/customers${path}`)
        .set('Authorization', bearer(accessToken))
        .send(body),
    patch: (path: string, body: object) =>
      request(app)
        .patch(`/api/customers${path}`)
        .set('Authorization', bearer(accessToken))
        .send(body),
  });

  async function createCustomer(body: object, accessToken = token): Promise<CustomerDto> {
    const res = await api(accessToken).post('', body).expect(201);
    return dataOf<CustomerDto>(res);
  }

  const names = (res: { body: unknown }) => (res.body as Page<CustomerDto>).data.map((c) => c.name);

  beforeAll(async () => {
    app = createAuthTestApp();
    token = (await registerOwner(app)).session.accessToken;
    otherToken = (await registerOwner(app)).session.accessToken;
  });

  it('requires authentication', async () => {
    await request(app).get('/api/customers').expect(401);
  });

  it('creates a customer with every field normalised, and reads it back', async () => {
    const res = await api().post('', FULL_CUSTOMER);

    expect(res.status).toBe(201);
    expect(res.headers['cache-control']).toBe('no-store');
    const customer = dataOf<CustomerDto>(res);
    expect(customer.id).toMatch(/^[a-f\d]{24}$/);
    expect(Number.isNaN(Date.parse(customer.createdAt))).toBe(false);
    expect(customer.updatedAt).toBe(customer.createdAt);
    expect(customer).toEqual({
      id: customer.id,
      name: 'Grace Okafor',
      email: 'grace@example.com',
      phone: '+1 (555) 010-1234',
      company: 'Okafor Dental',
      address: FULL_CUSTOMER.address,
      notes: 'Prefers WhatsApp.',
      archivedAt: null,
      createdAt: customer.createdAt,
      updatedAt: customer.updatedAt,
    });

    const reread = await api().get(`/${customer.id}`).expect(200);
    expect(dataOf(reread)).toEqual(customer);
  });

  it('stores blank optional fields as unset', async () => {
    const customer = await createCustomer({
      name: 'Blank Fields',
      email: '',
      phone: '',
      company: '',
      notes: '',
      address: { line1: '', city: '' },
    });
    expect(customer).toMatchObject({
      email: null,
      phone: null,
      company: null,
      notes: null,
      address: {},
    });
  });

  it('rejects invalid input with field errors', async () => {
    const res = await api().post('', { name: ' ', email: 'not-an-email', phone: 'call me' });

    expect(res.status).toBe(400);
    const error = errorOf(res);
    expect(error.code).toBe('VALIDATION_ERROR');
    expect(error.details?.map((d) => d.path).sort()).toEqual(['email', 'name', 'phone']);
  });

  it('rejects malformed ids and unknown query values', async () => {
    expect((await api().get('/not-an-id')).status).toBe(400);
    expect((await api().get('?archived=yes')).status).toBe(400);
    expect((await api().get('?pageSize=500')).status).toBe(400);
  });

  it('PATCH changes only the given fields and clears fields sent as empty strings', async () => {
    const customer = await createCustomer(FULL_CUSTOMER);

    const res = await api().patch(`/${customer.id}`, {
      company: 'Okafor Dental Group',
      email: '',
      notes: '',
      address: { line1: '9 Oak St', postalCode: '' },
    });

    expect(res.status).toBe(200);
    const updated = dataOf<CustomerDto>(res);
    expect(updated).toMatchObject({
      name: 'Grace Okafor',
      phone: '+1 (555) 010-1234',
      company: 'Okafor Dental Group',
      email: null,
      notes: null,
      address: { line1: '9 Oak St', city: 'Austin', state: 'TX', country: 'US' },
    });
    expect(updated.address).not.toHaveProperty('postalCode');
    expect(dataOf(await api().get(`/${customer.id}`))).toEqual(updated);
  });

  it('PATCH validates input and does not allow clearing the name', async () => {
    const customer = await createCustomer({ name: 'Keep Me' });

    const res = await api().patch(`/${customer.id}`, { name: '', email: 'bad' });

    expect(res.status).toBe(400);
    expect(
      errorOf(res)
        .details?.map((d) => d.path)
        .sort(),
    ).toEqual(['email', 'name']);
  });

  it('archives and restores, hiding archived customers from the default list', async () => {
    const customer = await createCustomer({ name: 'Archive Candidate' });

    const archived = dataOf<CustomerDto>(await api().post(`/${customer.id}/archive`).expect(200));
    expect(archived.archivedAt).toEqual(expect.any(String));

    const again = dataOf<CustomerDto>(await api().post(`/${customer.id}/archive`).expect(200));
    expect(again.archivedAt).toBe(archived.archivedAt);

    expect(names(await api().get('?search=Archive Candidate'))).toEqual([]);
    expect(names(await api().get('?search=Archive Candidate&archived=false'))).toEqual([]);
    expect(names(await api().get('?search=Archive Candidate&archived=true'))).toEqual([
      'Archive Candidate',
    ]);
    // Still readable directly, e.g. from an old quote.
    expect(dataOf<CustomerDto>(await api().get(`/${customer.id}`)).archivedAt).not.toBeNull();

    const restored = dataOf<CustomerDto>(await api().post(`/${customer.id}/restore`).expect(200));
    expect(restored.archivedAt).toBeNull();
    expect(names(await api().get('?search=Archive Candidate'))).toEqual(['Archive Candidate']);
  });

  describe('search and pagination', () => {
    let searchToken: string;

    beforeAll(async () => {
      searchToken = (await registerOwner(app)).session.accessToken;
      const customers = [
        { name: 'Alice Brown', email: 'alice@acme.example', company: 'Acme Ltd' },
        { name: 'Bob Stone', phone: '+1 (555) 222-3333', company: 'Stone & Sons' },
        { name: 'Chidi Eze', email: 'chidi@example.com', company: 'Eze (Lagos) Co.' },
        { name: 'Dana a.x(', company: 'Weird Names Inc' },
      ];
      for (const customer of customers) await createCustomer(customer, searchToken);
    });

    const search = (term: string) =>
      api(searchToken)
        .get(`?search=${encodeURIComponent(term)}`)
        .expect(200);

    it('lists newest first with pagination metadata', async () => {
      const res = await api(searchToken).get('?pageSize=3').expect(200);
      const page = res.body as Page<CustomerDto>;
      expect(page.data.map((c) => c.name)).toEqual(['Dana a.x(', 'Chidi Eze', 'Bob Stone']);
      expect(page.meta).toEqual({ page: 1, pageSize: 3, total: 4, totalPages: 2 });

      const second = await api(searchToken).get('?pageSize=3&page=2').expect(200);
      expect(names(second)).toEqual(['Alice Brown']);
    });

    it('matches name, email, phone and company case-insensitively', async () => {
      expect(names(await search('alice'))).toEqual(['Alice Brown']);
      expect(names(await search('ACME.EXAMPLE'))).toEqual(['Alice Brown']);
      expect(names(await search('stone & sons'))).toEqual(['Bob Stone']);
      expect(names(await search('222-3333'))).toEqual(['Bob Stone']);
      expect(names(await search('5552223333'))).toEqual(['Bob Stone']);
    });

    it('treats regex metacharacters literally', async () => {
      expect(names(await search('a.*('))).toEqual([]);
      expect(names(await search('(Lagos)'))).toEqual(['Chidi Eze']);
      expect(names(await search('a.x('))).toEqual(['Dana a.x(']);
      expect(names(await search('.*'))).toEqual([]);
      expect(names(await search('[a-z]+'))).toEqual([]);
      expect(names(await search('\\'))).toEqual([]);
    });
  });

  it('lets staff manage customers too', async () => {
    const owner = await registerOwner(app);
    const staff = await addUser(app, owner.session.business.id, 'staff');
    const customer = await createCustomer({ name: 'Staff Made' }, staff.session.accessToken);
    await api(staff.session.accessToken).patch(`/${customer.id}`, { company: 'X' }).expect(200);
    await api(staff.session.accessToken).post(`/${customer.id}/archive`).expect(200);
    expect(names(await api(owner.session.accessToken).get('?archived=true'))).toEqual([
      'Staff Made',
    ]);
  });

  it("isolates tenants: another business's customer is a 404 everywhere", async () => {
    const customer = await createCustomer({ name: 'Private Customer', email: 'p@example.com' });
    const other = api(otherToken);

    const responses = await Promise.all([
      other.get(`/${customer.id}`),
      other.patch(`/${customer.id}`, { name: 'Hijacked' }),
      other.post(`/${customer.id}/archive`),
      other.post(`/${customer.id}/restore`),
    ]);
    for (const res of responses) {
      expect(res.status).toBe(404);
      expect(errorOf(res).code).toBe('NOT_FOUND');
    }
    expect(names(await other.get('?search=Private Customer&archived=true'))).toEqual([]);

    const unchanged = dataOf<CustomerDto>(await api().get(`/${customer.id}`));
    expect(unchanged).toEqual(customer);
  });

  it('returns 404 for an id that does not exist', async () => {
    const res = await api().get(`/${new Types.ObjectId().toString()}`);
    expect(res.status).toBe(404);
  });
});

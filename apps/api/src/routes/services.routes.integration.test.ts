import type { ServiceDto } from '@quoteflow/shared';
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

describe.skipIf(!TEST_DATABASE_URI)('service routes (database)', () => {
  useTestDatabase();

  let app: Express;
  let token: string;
  let otherToken: string;

  const api = (accessToken = token) => {
    const auth = bearer(accessToken);
    return {
      get: (path: string) => request(app).get(`/api/services${path}`).set('Authorization', auth),
      post: (body: object) =>
        request(app).post('/api/services').set('Authorization', auth).send(body),
      patch: (path: string, body: object) =>
        request(app).patch(`/api/services${path}`).set('Authorization', auth).send(body),
      delete: (path: string) =>
        request(app).delete(`/api/services${path}`).set('Authorization', auth),
    };
  };

  async function createService(body: object, accessToken = token): Promise<ServiceDto> {
    return dataOf<ServiceDto>(await api(accessToken).post(body).expect(201));
  }

  const names = (res: { body: unknown }) => (res.body as Page<ServiceDto>).data.map((s) => s.name);

  beforeAll(async () => {
    app = createAuthTestApp();
    token = (await registerOwner(app)).session.accessToken;
    otherToken = (await registerOwner(app)).session.accessToken;
  });

  it('requires authentication', async () => {
    await request(app).get('/api/services').expect(401);
  });

  it('creates, reads, updates and deletes a service', async () => {
    const res = await api().post({
      name: ' Deep cleaning ',
      description: 'Whole-home deep clean',
      price: 18_000,
      unit: 'visit',
    });
    expect(res.status).toBe(201);
    const service = dataOf<ServiceDto>(res);
    expect(service.id).toMatch(/^[a-f\d]{24}$/);
    expect(Number.isNaN(Date.parse(service.createdAt))).toBe(false);
    expect(service.updatedAt).toBe(service.createdAt);
    expect(service).toEqual({
      id: service.id,
      name: 'Deep cleaning',
      description: 'Whole-home deep clean',
      price: 18_000,
      unit: 'visit',
      active: true,
      createdAt: service.createdAt,
      updatedAt: service.updatedAt,
    });
    expect(dataOf(await api().get(`/${service.id}`).expect(200))).toEqual(service);

    const updated = dataOf<ServiceDto>(
      await api()
        .patch(`/${service.id}`, { price: 19_500, description: '', unit: '', active: false })
        .expect(200),
    );
    expect(updated).toMatchObject({
      name: 'Deep cleaning',
      price: 19_500,
      description: null,
      unit: null,
      active: false,
    });

    const deleted = await api().delete(`/${service.id}`);
    expect(deleted.status).toBe(204);
    expect(deleted.text).toBe('');
    await api().get(`/${service.id}`).expect(404);
    await api().delete(`/${service.id}`).expect(404);
  });

  it('stores blank optional fields as unset', async () => {
    const service = await createService({ name: 'Bare', price: 0, description: '', unit: '' });
    expect(service).toMatchObject({ description: null, unit: null, price: 0 });
  });

  it('rejects invalid input with field errors', async () => {
    const res = await api().post({ name: '', price: 12.5 });
    expect(res.status).toBe(400);
    expect(
      errorOf(res)
        .details?.map((d) => d.path)
        .sort(),
    ).toEqual(['name', 'price']);

    const negative = await api().post({ name: 'Negative', price: -1 });
    expect(negative.status).toBe(400);

    const service = await createService({ name: 'Valid', price: 100 });
    const badPatch = await api().patch(`/${service.id}`, { price: 'free', active: 'yes' });
    expect(badPatch.status).toBe(400);
    expect(
      errorOf(badPatch)
        .details?.map((d) => d.path)
        .sort(),
    ).toEqual(['active', 'price']);
    await api().get('/nope').expect(400);
    await api().get('?active=maybe').expect(400);
  });

  describe('listing', () => {
    let listToken: string;

    beforeAll(async () => {
      listToken = (await registerOwner(app)).session.accessToken;
      const services = [
        { name: 'Interior painting', description: 'Per room (walls + ceiling)', price: 25_000 },
        { name: 'AC installation', description: 'Split unit, up to 2.5 tons', price: 45_000 },
        { name: 'Carpet cleaning', price: 9_000, active: false },
        { name: 'Deep cleaning', description: 'Kitchen, bathrooms & floors', price: 18_000 },
      ];
      for (const service of services) await createService(service, listToken);
    });

    const list = (query: string) => api(listToken).get(query).expect(200);

    it('sorts by name and paginates', async () => {
      const page = (await list('?pageSize=2')).body as Page<ServiceDto>;
      expect(page.data.map((s) => s.name)).toEqual(['AC installation', 'Carpet cleaning']);
      expect(page.meta).toEqual({ page: 1, pageSize: 2, total: 4, totalPages: 2 });
      expect(names(await list('?pageSize=2&page=2'))).toEqual([
        'Deep cleaning',
        'Interior painting',
      ]);
    });

    it('filters by active state', async () => {
      expect(names(await list('?active=false'))).toEqual(['Carpet cleaning']);
      expect(names(await list('?active=true'))).toEqual([
        'AC installation',
        'Deep cleaning',
        'Interior painting',
      ]);
    });

    it('searches name and description case-insensitively, metacharacters literally', async () => {
      expect(names(await list('?search=CLEANING'))).toEqual(['Carpet cleaning', 'Deep cleaning']);
      expect(names(await list('?search=bathrooms'))).toEqual(['Deep cleaning']);
      expect(names(await list(`?search=${encodeURIComponent('(walls + ceiling)')}`))).toEqual([
        'Interior painting',
      ]);
      expect(names(await list('?search=2.5'))).toEqual(['AC installation']);
      expect(names(await list(`?search=${encodeURIComponent('a.*(')}`))).toEqual([]);
      expect(names(await list(`?search=${encodeURIComponent('.*')}`))).toEqual([]);
      expect(names(await list('?search=cleaning&active=true'))).toEqual(['Deep cleaning']);
    });
  });

  it('lets staff manage services', async () => {
    const owner = await registerOwner(app);
    const staff = (await addUser(app, owner.session.business.id, 'staff')).session.accessToken;
    const service = await createService({ name: 'Staff service', price: 500 }, staff);
    await api(staff).patch(`/${service.id}`, { active: false }).expect(200);
    await api(staff).delete(`/${service.id}`).expect(204);
  });

  it("isolates tenants: another business's service is a 404 everywhere", async () => {
    const service = await createService({ name: 'Private service', price: 1_000 });
    const other = api(otherToken);

    const responses = await Promise.all([
      other.get(`/${service.id}`),
      other.patch(`/${service.id}`, { price: 1 }),
      other.delete(`/${service.id}`),
    ]);
    for (const res of responses) {
      expect(res.status).toBe(404);
      expect(errorOf(res).code).toBe('NOT_FOUND');
    }
    expect(names(await other.get('?search=Private service'))).toEqual([]);
    expect(dataOf(await api().get(`/${service.id}`).expect(200))).toEqual(service);
  });

  it('returns 404 for an id that does not exist', async () => {
    await api().get(`/${new Types.ObjectId().toString()}`).expect(404);
  });
});

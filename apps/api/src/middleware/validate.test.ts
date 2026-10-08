import { lineItemsSchema, objectIdSchema, paginationQuerySchema } from '@quoteflow/shared';
import { type Request, type Response, Router } from 'express';
import request from 'supertest';
import { describe, expect, expectTypeOf, it } from 'vitest';
import { z } from 'zod';
import { createRouterTestApp, dataOf, errorOf } from '../test/helpers';
import { sendData } from '../utils/response';
import { type RequestSchemas, type ValidatedRequest, validate } from './validate';

const ID = '64b7f0c2a1b2c3d4e5f60718';

const updateItemsSchemas = {
  params: z.object({ id: objectIdSchema }),
  query: paginationQuerySchema.extend({ preview: z.stringbool().optional() }),
  body: z.object({ title: z.string().trim().min(1, 'Title is required'), items: lineItemsSchema }),
} satisfies RequestSchemas;

/** A controller declared on its own, as feature modules do. */
function updateItems(req: ValidatedRequest<typeof updateItemsSchemas>, res: Response): void {
  expectTypeOf(req.params.id).toEqualTypeOf<string>();
  expectTypeOf(req.query.page).toEqualTypeOf<number>();
  expectTypeOf(req.body.items[0]?.quantity).toEqualTypeOf<number | undefined>();
  sendData(res, {
    params: req.params,
    query: req.query,
    queryIsOwnProperty: Object.hasOwn(req, 'query'),
    body: req.body,
  });
}

function buildApp() {
  const router = Router();
  router.put('/quotes/:id/items', validate(updateItemsSchemas), updateItems);
  router.get('/customers', validate({ query: paginationQuerySchema }), (req, res) => {
    expectTypeOf(req.query.pageSize).toEqualTypeOf<number>();
    sendData(res, { page: req.query.page, pageSize: req.query.pageSize });
  });
  return createRouterTestApp(router);
}

const validBody = {
  title: '  Deep clean  ',
  items: [{ name: 'Kitchen', quantity: 1.5, unitPrice: 4500 }],
  unexpected: 'stripped',
};

describe('validate', () => {
  it('replaces params, query and body with the parsed values', async () => {
    const res = await request(buildApp())
      .put(`/quotes/${ID}/items?page=2&preview=true`)
      .send(validBody);

    expect(res.status).toBe(200);
    expect(dataOf(res)).toEqual({
      params: { id: ID },
      query: { page: 2, pageSize: 20, preview: true },
      queryIsOwnProperty: true,
      body: { title: 'Deep clean', items: [{ name: 'Kitchen', quantity: 1.5, unitPrice: 4500 }] },
    });
  });

  it('reports issues from every location in one VALIDATION_ERROR response', async () => {
    const res = await request(buildApp())
      .put('/quotes/not-an-id/items?page=0')
      .send({ title: ' ', items: [{ name: 'Kitchen', quantity: -1, unitPrice: 10.5 }] });

    expect(res.status).toBe(400);
    const error = errorOf(res);
    expect(error).toMatchObject({
      code: 'VALIDATION_ERROR',
      requestId: res.headers['x-request-id'],
    });
    expect(error.details?.map((detail) => detail.path)).toEqual([
      'id',
      'page',
      'title',
      'items.0.quantity',
      'items.0.unitPrice',
    ]);
    expect(error.details).toEqual(
      expect.arrayContaining([
        { path: 'id', message: 'Invalid identifier' },
        { path: 'title', message: 'Title is required' },
        { path: 'items.0.quantity', message: 'Quantity must be greater than zero' },
        { path: 'items.0.unitPrice', message: 'Amount must be in minor units' },
      ]),
    );
  });

  it('rejects a missing body', async () => {
    const res = await request(buildApp()).put(`/quotes/${ID}/items`);

    expect(res.status).toBe(400);
    expect(errorOf(res)).toMatchObject({ code: 'VALIDATION_ERROR', details: [{ path: '' }] });
  });

  it('rejects repeated query parameters instead of accepting arrays', async () => {
    const res = await request(buildApp()).get('/customers?page=1&page=2');

    expect(res.status).toBe(400);
    expect(errorOf(res)).toMatchObject({ code: 'VALIDATION_ERROR', details: [{ path: 'page' }] });
  });

  it('applies defaults when optional query parameters are absent', async () => {
    const res = await request(buildApp()).get('/customers');

    expect(res.body).toEqual({ data: { page: 1, pageSize: 20 } });
  });

  it('exposes the parsed types to separately declared controllers', () => {
    expectTypeOf<ValidatedRequest<typeof updateItemsSchemas>['params']>().toEqualTypeOf<{
      id: string;
    }>();
    expectTypeOf<ValidatedRequest<{ body: typeof lineItemsSchema }>['query']>().toEqualTypeOf<
      Request['query']
    >();
  });
});

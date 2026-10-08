import { Router } from 'express';
import mongoose from 'mongoose';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { TenantGuardError } from '../models/plugins/tenant-guard';
import { createCapturingLogger, createRouterTestApp, errorOf } from '../test/helpers';
import { AppError, conflict, notFound, validationFailed } from '../utils/app-error';
import { toClientError } from './error-handler';

const GENERIC_SERVER_ERROR = {
  code: 'INTERNAL_ERROR',
  message: 'Something went wrong. Please try again.',
};

function appThrowing(error: unknown, logger = createCapturingLogger().logger) {
  const router = Router();
  router.get('/sync', () => {
    throw error;
  });
  router.get('/async', async () => {
    await Promise.resolve();
    throw error;
  });
  return createRouterTestApp(router, logger);
}

describe('errorHandler', () => {
  it.each(['/sync', '/async'])(
    'hides unexpected errors behind a generic 500 (%s handler)',
    async (path) => {
      const res = await request(
        appThrowing(new Error('connect ECONNREFUSED 10.0.0.5:27017 password=hunter2')),
      ).get(path);

      expect(res.status).toBe(500);
      expect(res.body).toEqual({
        error: { ...GENERIC_SERVER_ERROR, requestId: res.headers['x-request-id'] },
      });
      expect(res.text).not.toMatch(/ECONNREFUSED|hunter2|at .*\.ts/);
    },
  );

  it('logs server errors once, at error level, with the original error and request context', async () => {
    const { logger, entries } = createCapturingLogger();
    const res = await request(appThrowing(new Error('database exploded'), logger))
      .get('/sync')
      .set('X-Request-Id', 'req-500');

    expect(res.status).toBe(500);
    const logged = entries();
    expect(logged).toHaveLength(1);
    expect(logged[0]).toMatchObject({
      level: 'error',
      reqId: 'req-500',
      req: { method: 'GET', url: '/sync' },
      res: { statusCode: 500 },
      err: { type: 'Error', message: 'database exploded' },
    });
    expect(logged[0]?.err).toHaveProperty('stack');
  });

  it('handles thrown values that are not Error instances', async () => {
    const { logger, entries } = createCapturingLogger();
    const res = await request(appThrowing('just a string', logger)).get('/sync');

    expect(res.status).toBe(500);
    expect(errorOf(res)).toMatchObject(GENERIC_SERVER_ERROR);
    expect(entries()[0]).toMatchObject({
      level: 'error',
      err: { message: 'A non-error value was thrown' },
    });
  });

  it('returns AppErrors with their own status, code, message and details', async () => {
    const details = [{ path: 'email', message: 'Email is already registered' }];
    const res = await request(
      appThrowing(validationFailed(details, 'Please fix the highlighted fields.')),
    ).get('/async');

    expect(res.status).toBe(400);
    expect(res.body).toEqual({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Please fix the highlighted fields.',
        details,
        requestId: res.headers['x-request-id'],
      },
    });
  });

  it('logs client errors at warn level without the error object', async () => {
    const { logger, entries } = createCapturingLogger();
    await request(appThrowing(notFound('Quote not found.'), logger))
      .get('/sync')
      .expect(404);

    const [entry] = entries();
    expect(entry).toMatchObject({ level: 'warn', res: { statusCode: 404 } });
    expect(entry).not.toHaveProperty('err');
  });

  it('delegates to Express when the response has already started', async () => {
    const router = Router();
    router.get('/stream', (_req, res) => {
      res.status(200).write('partial');
      throw new Error('failed mid-stream');
    });
    const { logger, entries } = createCapturingLogger();

    await expect(request(createRouterTestApp(router, logger)).get('/stream')).rejects.toThrow();
    expect(entries()[0]).toMatchObject({ level: 'error', err: { message: 'failed mid-stream' } });
  });
});

describe('toClientError', () => {
  it('passes AppErrors through unchanged', () => {
    const error = conflict('Quote already converted.');
    expect(toClientError(error)).toBe(error);
  });

  it('maps a Mongoose CastError to 400 BAD_REQUEST', () => {
    const error = toClientError(new mongoose.Error.CastError('ObjectId', 'not-an-id', '_id'));
    expect(error).toMatchObject({
      status: 400,
      code: 'BAD_REQUEST',
      message: 'Invalid identifier',
    });
  });

  it('maps a Mongoose ValidationError to 400 VALIDATION_ERROR with field details', () => {
    const validationError = new mongoose.Error.ValidationError();
    validationError.addError(
      'name',
      new mongoose.Error.ValidatorError({ path: 'name', message: 'Name is required' }),
    );
    validationError.addError(
      'items.0.quantity',
      new mongoose.Error.CastError('Number', 'lots', 'items.0.quantity'),
    );

    expect(toClientError(validationError)).toMatchObject({
      status: 400,
      code: 'VALIDATION_ERROR',
      details: [
        { path: 'name', message: 'Name is required' },
        { path: 'items.0.quantity', message: 'Invalid value' },
      ],
    });
  });

  it('maps a duplicate key error to 409 CONFLICT without leaking the index or value', () => {
    const duplicate = new mongoose.mongo.MongoServerError({
      message:
        'E11000 duplicate key error collection: quoteflow.users index: email_1 dup key: { email: "owner@example.com" }',
      code: 11000,
    });

    const error = toClientError(duplicate);
    expect(error).toMatchObject({ status: 409, code: 'CONFLICT' });
    expect(JSON.stringify({ message: error.message, details: error.details })).not.toMatch(
      /E11000|email|owner@example\.com|quoteflow/,
    );
  });

  it('maps a VersionError from a concurrent save to 409 CONFLICT', () => {
    const document = new (mongoose.model('VersionedThing', new mongoose.Schema({ n: Number })))();
    const error = toClientError(new mongoose.Error.VersionError(document, 3, ['n']));
    expect(error).toMatchObject({ status: 409, code: 'CONFLICT' });
  });

  it('reports a tenant guard violation as a generic internal error', () => {
    const error = toClientError(new TenantGuardError('find on Quote must filter by businessId'));
    expect(error).toMatchObject({ status: 500, ...GENERIC_SERVER_ERROR });
  });

  it('treats other database errors as internal errors', () => {
    const error = toClientError(new mongoose.mongo.MongoServerError({ message: 'boom', code: 2 }));
    expect(error).toMatchObject({ status: 500, ...GENERIC_SERVER_ERROR });
  });

  it('maps other exposed 4xx HTTP errors to a generic BAD_REQUEST', () => {
    const unsupportedCharset = Object.assign(new Error('unsupported charset "UTF-7"'), {
      status: 415,
      expose: true,
      type: 'charset.unsupported',
    });

    expect(toClientError(unsupportedCharset)).toMatchObject({
      status: 400,
      code: 'BAD_REQUEST',
      message: 'The request could not be processed.',
    });
  });

  it('does not trust 5xx or unexposed HTTP errors', () => {
    const streamError = Object.assign(new Error('stream encoding should not be set'), {
      status: 500,
      expose: false,
      type: 'stream.encoding.set',
    });

    expect(toClientError(streamError)).toMatchObject({ status: 500, ...GENERIC_SERVER_ERROR });
  });

  it('keeps AppError status and code consistent', () => {
    expect(new AppError('RATE_LIMITED', 'Slow down')).toMatchObject({ status: 429 });
    expect(new AppError('SERVICE_UNAVAILABLE', 'Down')).toMatchObject({ status: 503 });
  });
});

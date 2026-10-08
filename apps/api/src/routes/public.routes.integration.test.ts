import type { PublicInvoiceDto, PublicQuoteDto } from '@quoteflow/shared';
import type { Express } from 'express';
import { Types } from 'mongoose';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { BusinessModel, InvoiceModel, QuoteModel } from '../models';
import { createAuthTestApp, createTestClock } from '../test/auth';
import {
  TEST_DATABASE_URI,
  recordCommands,
  supportsAtomicIncrements,
  useTestDatabase,
} from '../test/database';
import { createCapturingLogger, dataOf, errorOf } from '../test/helpers';
import { invoiceInput, paymentInput, quoteInput } from '../test/model-fixtures';
import { generatePublicToken } from '../utils/tokens';
import { PUBLIC_RATE_LIMITS } from './public.routes';

const NOW = new Date('2026-10-08T10:00:00.000Z');
const MINUTE_MS = 60_000;
const day = (isoDate: string) => new Date(`${isoDate}T00:00:00.000Z`);

/** Fields that exist on stored documents but must never reach a customer. */
const INTERNAL_FIELDS = [
  '_id',
  'id',
  'businessId',
  'customerId',
  'createdBy',
  'publicToken',
  'viewedAt',
  'lastViewedAt',
  'sentAt',
  'invoiceId',
  'convertedAt',
  'payments',
  'recordedBy',
  'quoteId',
  '__v',
  'createdAt',
  'updatedAt',
];

function expectNoInternalFields(body: unknown, token: string): void {
  const json = JSON.stringify(body);
  expect(json).not.toContain(token);
  for (const field of INTERNAL_FIELDS) expect(json).not.toContain(`"${field}"`);
}

async function createBusiness(overrides: Record<string, unknown> = {}) {
  return BusinessModel.create({
    name: 'Sparkle Cleaning Co.',
    email: 'hello@sparkle.example',
    phone: '+234 801 234 5678',
    brandColor: '#1d4ed8',
    timezone: 'Africa/Lagos',
    currency: 'NGN',
    ...overrides,
  });
}

async function createQuote(businessId: Types.ObjectId, overrides: Record<string, unknown> = {}) {
  return QuoteModel.create(
    quoteInput({
      businessId,
      status: 'sent',
      sentAt: NOW,
      currency: 'NGN',
      issueDate: day('2026-10-01'),
      expiryDate: day('2026-10-15'),
      items: [
        {
          serviceId: new Types.ObjectId(),
          name: 'Deep cleaning',
          description: 'Kitchen and two bathrooms',
          quantity: 2.5,
          unit: 'hour',
          unitPrice: 5_500,
        },
      ],
      discount: { type: 'percentage', value: 10 },
      taxRate: 7.5,
      notes: 'Thanks for choosing us.',
      ...overrides,
    }),
  );
}

describe.skipIf(!TEST_DATABASE_URI)('public routes (database)', () => {
  useTestDatabase();

  function testApp(now: Date = NOW): { app: Express; clock: ReturnType<typeof createTestClock> } {
    const clock = createTestClock(now);
    return { app: createAuthTestApp({ clock: clock.now }), clock };
  }

  const view = (app: Express, token: string) => request(app).get(`/api/public/quotes/${token}`);
  const accept = (app: Express, token: string) =>
    request(app).post(`/api/public/quotes/${token}/accept`);
  const reject = (app: Express, token: string, body?: object) =>
    request(app).post(`/api/public/quotes/${token}/reject`).send(body);

  describe('GET /public/quotes/:token', () => {
    it('returns the quote and the public business details, and nothing internal', async () => {
      const { app } = testApp();
      const business = await createBusiness({ website: 'https://sparkle.example' });
      const quote = await createQuote(business._id);

      const res = await view(app, quote.publicToken).expect(200);

      expect(res.headers['cache-control']).toBe('no-store');
      expect(dataOf<PublicQuoteDto>(res)).toEqual({
        business: {
          name: 'Sparkle Cleaning Co.',
          logoUrl: null,
          email: 'hello@sparkle.example',
          phone: '+234 801 234 5678',
          website: 'https://sparkle.example',
          address: {},
          brandColor: '#1d4ed8',
        },
        quote: {
          quoteNumber: 'QT-0001',
          status: 'viewed',
          currency: 'NGN',
          customer: {
            name: 'Olivia Harper',
            email: 'olivia.harper@example.com',
            phone: null,
            company: null,
            address: {},
          },
          items: [
            {
              serviceId: null,
              name: 'Deep cleaning',
              description: 'Kitchen and two bathrooms',
              quantity: 2.5,
              unit: 'hour',
              unitPrice: 5_500,
              amount: 13_750,
            },
          ],
          discount: { type: 'percentage', value: 10 },
          taxRate: 7.5,
          totals: { subtotal: 13_750, discount: 1_375, tax: 928, total: 13_303 },
          notes: 'Thanks for choosing us.',
          terms: null,
          issueDate: '2026-10-01',
          expiryDate: '2026-10-15',
          acceptedAt: null,
          rejectedAt: null,
          rejectionReason: null,
        },
      } satisfies PublicQuoteDto);
      expectNoInternalFields(res.body, quote.publicToken);
    });

    it('records the first view and keeps the last view current without rewriting every refresh', async () => {
      const { app, clock } = testApp();
      const business = await createBusiness();
      const quote = await createQuote(business._id);
      const scope = { _id: quote._id, businessId: business._id };

      await view(app, quote.publicToken).expect(200);
      let stored = await QuoteModel.findOne(scope).lean();
      expect(stored).toMatchObject({ status: 'viewed', viewedAt: NOW, lastViewedAt: NOW });

      clock.advance(10_000);
      await view(app, quote.publicToken).expect(200);
      stored = await QuoteModel.findOne(scope).lean();
      expect(stored?.lastViewedAt).toEqual(NOW);

      clock.advance(2 * MINUTE_MS);
      const later = clock.now();
      const res = await view(app, quote.publicToken).expect(200);
      expect(dataOf<PublicQuoteDto>(res).quote.status).toBe('viewed');
      stored = await QuoteModel.findOne(scope).lean();
      expect(stored).toMatchObject({ status: 'viewed', viewedAt: NOW, lastViewedAt: later });
    });

    it('does not record views of answered or expired quotes', async () => {
      const { app } = testApp();
      const business = await createBusiness();
      const accepted = await createQuote(business._id, {
        status: 'accepted',
        acceptedAt: day('2026-10-05'),
      });
      const expired = await createQuote(business._id, {
        quoteNumber: 'QT-0002',
        expiryDate: day('2026-10-07'),
      });

      const acceptedRes = await view(app, accepted.publicToken).expect(200);
      expect(dataOf<PublicQuoteDto>(acceptedRes).quote).toMatchObject({
        status: 'accepted',
        acceptedAt: '2026-10-05T00:00:00.000Z',
      });
      const expiredRes = await view(app, expired.publicToken).expect(200);
      expect(dataOf<PublicQuoteDto>(expiredRes).quote.status).toBe('expired');

      const stored = await QuoteModel.find({ businessId: business._id }).lean();
      for (const quote of stored) {
        expect(quote.lastViewedAt).toBeUndefined();
        expect(quote.viewedAt).toBeUndefined();
      }
      expect(stored.find((q) => q.quoteNumber === 'QT-0002')?.status).toBe('sent');
    });

    it('evaluates expiry in the business time zone', async () => {
      // 23:30 UTC on Oct 8 is already Oct 9 in Kiritimati (UTC+14).
      const { app } = testApp(new Date('2026-10-08T23:30:00.000Z'));
      const ahead = await createBusiness({ timezone: 'Pacific/Kiritimati' });
      const utc = await createBusiness({ timezone: 'UTC' });
      const expiryDate = day('2026-10-08');
      const aheadQuote = await createQuote(ahead._id, { expiryDate });
      const utcQuote = await createQuote(utc._id, { expiryDate });

      const aheadRes = await view(app, aheadQuote.publicToken).expect(200);
      const utcRes = await view(app, utcQuote.publicToken).expect(200);

      expect(dataOf<PublicQuoteDto>(aheadRes).quote.status).toBe('expired');
      expect(dataOf<PublicQuoteDto>(utcRes).quote.status).toBe('viewed');
    });

    it('hides drafts and unknown tokens behind the same 404', async () => {
      const { app } = testApp();
      const business = await createBusiness();
      const draft = await createQuote(business._id, { status: 'draft', sentAt: undefined });

      const draftRes = await view(app, draft.publicToken).expect(404);
      const unknownRes = await view(app, generatePublicToken()).expect(404);

      expect(errorOf(draftRes)).toMatchObject({ code: 'NOT_FOUND' });
      expect(errorOf(unknownRes).message).toBe(errorOf(draftRes).message);
      expect(draftRes.headers['cache-control']).toBe('no-store');
    });

    it('rejects a malformed token with a 404 without querying the database', async () => {
      const { app } = testApp();

      const commands = await recordCommands(async () => {
        await view(app, 'not-a-token').expect(404);
        await view(app, `${generatePublicToken()}x`).expect(404);
        await accept(app, 'abc').expect(404);
        await request(app).get('/api/public/invoices/abc').expect(404);
      });

      expect(commands.map((command) => command.name)).toEqual([]);
    });
  });

  describe('POST /public/quotes/:token/accept and /reject', () => {
    it('accepts a live quote once', async () => {
      const { app, clock } = testApp();
      const business = await createBusiness();
      const quote = await createQuote(business._id, { status: 'viewed', viewedAt: NOW });

      const res = await accept(app, quote.publicToken).expect(200);

      expect(res.headers['cache-control']).toBe('no-store');
      expect(dataOf<PublicQuoteDto>(res).quote).toMatchObject({
        status: 'accepted',
        acceptedAt: NOW.toISOString(),
        rejectedAt: null,
      });
      expectNoInternalFields(res.body, quote.publicToken);
      const stored = await QuoteModel.findOne({ _id: quote._id, businessId: business._id }).lean();
      expect(stored).toMatchObject({ status: 'accepted', acceptedAt: NOW });

      clock.advance(MINUTE_MS);
      const again = await accept(app, quote.publicToken).expect(409);
      expect(errorOf(again)).toMatchObject({
        code: 'CONFLICT',
        message: 'This quote has already been accepted.',
      });
      const declined = await reject(app, quote.publicToken, {}).expect(409);
      expect(errorOf(declined).message).toBe('This quote has already been accepted.');
    });

    it('declines with an optional, trimmed reason', async () => {
      const { app } = testApp();
      const business = await createBusiness();
      const withReason = await createQuote(business._id);
      const withoutReason = await createQuote(business._id, { quoteNumber: 'QT-0002' });

      const res = await reject(app, withReason.publicToken, {
        reason: '  We found a cheaper option.  ',
      }).expect(200);
      expect(dataOf<PublicQuoteDto>(res).quote).toMatchObject({
        status: 'rejected',
        rejectedAt: NOW.toISOString(),
        rejectionReason: 'We found a cheaper option.',
        acceptedAt: null,
      });

      // A bare POST (no body) declines without a reason.
      const bare = await request(app)
        .post(`/api/public/quotes/${withoutReason.publicToken}/reject`)
        .expect(200);
      expect(dataOf<PublicQuoteDto>(bare).quote).toMatchObject({
        status: 'rejected',
        rejectionReason: null,
      });

      const again = await accept(app, withReason.publicToken).expect(409);
      expect(errorOf(again).message).toBe('This quote has already been declined.');
    });

    it('validates the reason', async () => {
      const { app } = testApp();
      const business = await createBusiness();
      const quote = await createQuote(business._id);

      const res = await reject(app, quote.publicToken, { reason: 'x'.repeat(1001) }).expect(400);

      expect(errorOf(res)).toMatchObject({ code: 'VALIDATION_ERROR' });
      const stored = await QuoteModel.findOne({ _id: quote._id, businessId: business._id }).lean();
      expect(stored?.status).toBe('sent');
    });

    it('refuses to answer an expired quote and points the customer to the business', async () => {
      const { app } = testApp();
      const business = await createBusiness();
      const quote = await createQuote(business._id, { expiryDate: day('2026-10-07') });

      const accepted = await accept(app, quote.publicToken).expect(409);
      const declined = await reject(app, quote.publicToken, {}).expect(409);

      const message =
        'This quote has expired. Please contact Sparkle Cleaning Co. for an updated quote.';
      expect(errorOf(accepted).message).toBe(message);
      expect(errorOf(declined).message).toBe(message);
      const stored = await QuoteModel.findOne({ _id: quote._id, businessId: business._id }).lean();
      expect(stored?.status).toBe('sent');
    });

    it('can still be answered on its expiry date', async () => {
      const { app } = testApp();
      const business = await createBusiness();
      const quote = await createQuote(business._id, { expiryDate: day('2026-10-08') });

      await accept(app, quote.publicToken).expect(200);
    });

    it('lets exactly one of two concurrent answers win', async (context) => {
      context.skip(
        !(await supportsAtomicIncrements()),
        'This MongoDB stand-in does not apply concurrent updates to one document atomically; run against MongoDB to cover this.',
      );
      const { app } = testApp();
      const business = await createBusiness();
      const first = await createQuote(business._id);
      const second = await createQuote(business._id, { quoteNumber: 'QT-0002' });

      const doubleAccept = await Promise.all([
        accept(app, first.publicToken),
        accept(app, first.publicToken),
      ]);
      const acceptOrReject = await Promise.all([
        accept(app, second.publicToken),
        reject(app, second.publicToken, { reason: 'Changed my mind' }),
      ]);

      for (const responses of [doubleAccept, acceptOrReject]) {
        expect(responses.map((res) => res.status).sort()).toEqual([200, 409]);
      }
      const [winner] = acceptOrReject.filter((res) => res.status === 200);
      const stored = await QuoteModel.findOne({ _id: second._id, businessId: business._id }).lean();
      expect(stored?.status).toBe(dataOf<PublicQuoteDto>(winner ?? { body: {} }).quote.status);
    });

    it('treats drafts and unknown tokens as not found', async () => {
      const { app } = testApp();
      const business = await createBusiness();
      const draft = await createQuote(business._id, { status: 'draft', sentAt: undefined });

      await accept(app, draft.publicToken).expect(404);
      await reject(app, draft.publicToken, {}).expect(404);
      await accept(app, generatePublicToken()).expect(404);

      const stored = await QuoteModel.findOne({ _id: draft._id, businessId: business._id }).lean();
      expect(stored?.status).toBe('draft');
    });
  });

  describe('GET /public/invoices/:token', () => {
    async function createInvoice(
      businessId: Types.ObjectId,
      overrides: Record<string, unknown> = {},
    ) {
      return InvoiceModel.create(
        invoiceInput({
          businessId,
          status: 'partially_paid',
          sentAt: NOW,
          currency: 'NGN',
          quoteId: new Types.ObjectId(),
          issueDate: day('2026-10-01'),
          dueDate: day('2026-10-15'),
          payments: [paymentInput({ amount: 5_000, reference: 'TRX-1' })],
          terms: 'Due on receipt.',
          ...overrides,
        }),
      );
    }

    it('returns the invoice with its balance, and nothing internal', async () => {
      const { app } = testApp();
      const business = await createBusiness();
      const invoice = await createInvoice(business._id);

      const res = await request(app).get(`/api/public/invoices/${invoice.publicToken}`).expect(200);

      expect(res.headers['cache-control']).toBe('no-store');
      const dto = dataOf<PublicInvoiceDto>(res);
      expect(dto.invoice).toEqual({
        invoiceNumber: 'INV-0001',
        status: 'partially_paid',
        currency: 'NGN',
        customer: {
          name: 'Olivia Harper',
          email: 'olivia.harper@example.com',
          phone: null,
          company: null,
          address: {},
        },
        items: [
          {
            serviceId: null,
            name: 'Deep cleaning',
            description: null,
            quantity: 2.5,
            unit: 'hour',
            unitPrice: 5_500,
            amount: 13_750,
          },
        ],
        discount: null,
        taxRate: 0,
        totals: { subtotal: 13_750, discount: 0, tax: 0, total: 13_750 },
        amountPaid: 5_000,
        balanceDue: 8_750,
        notes: null,
        terms: 'Due on receipt.',
        issueDate: '2026-10-01',
        dueDate: '2026-10-15',
        paidAt: null,
      } satisfies PublicInvoiceDto['invoice']);
      expect(dto.business.name).toBe('Sparkle Cleaning Co.');
      expectNoInternalFields(res.body, invoice.publicToken);
      expect(JSON.stringify(res.body)).not.toContain('TRX-1');
    });

    it('reports an unpaid invoice past its due date as overdue', async () => {
      const { app } = testApp();
      const business = await createBusiness();
      const invoice = await createInvoice(business._id, {
        status: 'sent',
        payments: [],
        dueDate: day('2026-10-07'),
      });

      const res = await request(app).get(`/api/public/invoices/${invoice.publicToken}`).expect(200);

      expect(dataOf<PublicInvoiceDto>(res).invoice.status).toBe('overdue');
    });

    it('hides draft invoices', async () => {
      const { app } = testApp();
      const business = await createBusiness();
      const draft = await createInvoice(business._id, {
        status: 'draft',
        payments: [],
        sentAt: undefined,
      });

      const res = await request(app).get(`/api/public/invoices/${draft.publicToken}`).expect(404);

      expect(errorOf(res).code).toBe('NOT_FOUND');
    });
  });

  describe('protection', () => {
    it('rate limits answers per client', async () => {
      const { app } = testApp();
      const { limit } = PUBLIC_RATE_LIMITS.respond;

      for (let attempt = 0; attempt < limit; attempt += 1) {
        await accept(app, 'malformed').expect(404);
      }
      const limited = await reject(app, 'malformed', {}).expect(429);

      expect(errorOf(limited).code).toBe('RATE_LIMITED');
      expect(limited.headers['cache-control']).toBe('no-store');
    });

    it('rate limits views per client', async () => {
      const { app } = testApp();
      const { limit } = PUBLIC_RATE_LIMITS.view;

      for (let attempt = 0; attempt < limit; attempt += 1) {
        await request(app).get('/api/public/invoices/malformed').expect(404);
      }
      const limited = await view(app, 'malformed').expect(429);

      expect(errorOf(limited).code).toBe('RATE_LIMITED');
    });

    it('keeps public tokens out of the request log', async () => {
      const { logger, entries } = createCapturingLogger();
      const app = createAuthTestApp({ logger, clock: createTestClock(NOW).now });
      const business = await createBusiness();
      const quote = await createQuote(business._id);

      await view(app, quote.publicToken).expect(200);
      await accept(app, quote.publicToken).expect(200);

      const log = JSON.stringify(entries());
      expect(log).toContain('/api/public/quotes/:token/accept');
      expect(log).not.toContain(quote.publicToken);
    });
  });
});

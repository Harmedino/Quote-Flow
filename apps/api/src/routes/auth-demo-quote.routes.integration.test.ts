import type { DemoQuoteDto, PublicQuoteDto } from '@quoteflow/shared';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { DEMO_OWNER_EMAIL } from '../demo/data/business';
import { DEMO_CUSTOMERS } from '../demo/data/customers';
import { OPEN_QUOTE_PLAN } from '../demo/data/documents';
import { removeDemoBusiness } from '../demo/reset';
import { BusinessModel, CustomerModel, QuoteModel, UserModel } from '../models';
import { createAuthTestApp } from '../test/auth';
import { TEST_DATABASE_URI, useTestDatabase } from '../test/database';
import { TEST_ORIGIN, createTestEnv, dataOf } from '../test/helpers';

type App = ReturnType<typeof createAuthTestApp>;

/** The customer the demo sends a new quote to once every open one is answered. */
const PLANNED_CUSTOMER = DEMO_CUSTOMERS[OPEN_QUOTE_PLAN.customer].name;

function demoApp(): App {
  return createAuthTestApp({ env: createTestEnv({ DEMO_LOGIN_ENABLED: 'true' }) });
}

function openDemoQuote(app: App) {
  return request(app).post('/api/auth/demo/quote').set('Origin', TEST_ORIGIN);
}

async function tokenOf(app: App): Promise<string> {
  return dataOf<DemoQuoteDto>(await openDemoQuote(app).expect(200)).publicToken;
}

/** What the customer's page loads, then their acceptance of the revision they saw. */
async function acceptAsCustomer(app: App, token: string) {
  const view = dataOf<PublicQuoteDto>(
    await request(app).get(`/api/public/quotes/${token}`).expect(200),
  );
  await request(app)
    .post(`/api/public/quotes/${token}/accept`)
    .send({ revision: view.quote.revision })
    .expect(200);
  return view;
}

async function demoBusinessId() {
  const owner = await UserModel.findOne({ email: DEMO_OWNER_EMAIL }, null, {
    skipTenantGuard: true,
  }).lean();
  if (!owner) throw new Error('The demo has not been built');
  return owner.businessId;
}

/** Answers every quote of the demo that a customer could still accept, as visitors would. */
async function answerEveryOpenQuote(app: App) {
  const businessId = await demoBusinessId();
  const open = await QuoteModel.find({ businessId, status: { $in: ['sent', 'viewed'] } }).lean();
  for (const quote of open) await acceptAsCustomer(app, quote.publicToken);
  return open.map((quote) => quote.publicToken);
}

describe('POST /api/auth/demo/quote', () => {
  it('is not found when the demo is disabled', async () => {
    await request(createAuthTestApp())
      .post('/api/auth/demo/quote')
      .set('Origin', TEST_ORIGIN)
      .expect(404);
  });

  it('refuses requests from another website', async () => {
    await request(demoApp())
      .post('/api/auth/demo/quote')
      .set('Origin', 'https://evil.example')
      .expect(403);
  });
});

describe.skipIf(!TEST_DATABASE_URI)('POST /api/auth/demo/quote (database)', () => {
  useTestDatabase();

  it('builds the demo on first use and returns a quote its customer can accept', async () => {
    const app = demoApp();
    await removeDemoBusiness();

    const token = await tokenOf(app);

    expect(
      await BusinessModel.exists({ _id: await demoBusinessId(), isDemo: true }),
    ).not.toBeNull();
    const view = await acceptAsCustomer(app, token);
    expect(['sent', 'viewed']).toContain(view.quote.status);
  });

  it('reuses an open quote instead of sending new ones', async () => {
    const app = demoApp();
    await removeDemoBusiness();
    const first = await tokenOf(app);
    const quotes = await QuoteModel.countDocuments({ businessId: await demoBusinessId() });

    expect(await tokenOf(app)).toBe(first);
    expect(await QuoteModel.countDocuments({ businessId: await demoBusinessId() })).toBe(quotes);
  });

  it('sends a new quote once visitors have answered every open one', async () => {
    const app = demoApp();
    await removeDemoBusiness();
    await tokenOf(app);
    const answered = await answerEveryOpenQuote(app);
    expect(answered.length).toBeGreaterThan(0);

    const token = await tokenOf(app);

    expect(answered).not.toContain(token);
    const view = await acceptAsCustomer(app, token);
    // Opening it recorded the customer's first view.
    expect(view.quote.status).toBe('viewed');
    expect(view.quote.customer.name).toBe(PLANNED_CUSTOMER);
    expect(view.quote.items.length).toBeGreaterThan(0);
  });

  it('does not offer an expired quote', async () => {
    const app = demoApp();
    await removeDemoBusiness();
    const expired = await tokenOf(app);
    const businessId = await demoBusinessId();
    await QuoteModel.updateMany(
      { businessId, status: { $in: ['sent', 'viewed'] } },
      { $set: { expiryDate: new Date('2020-01-01T00:00:00Z') } },
    ).setOptions({ allowAtomicUpdate: true });

    const token = await tokenOf(app);

    expect(token).not.toBe(expired);
    await acceptAsCustomer(app, token);
  });

  it('still sends one when a visitor has renamed the planned customer', async () => {
    const app = demoApp();
    await removeDemoBusiness();
    await tokenOf(app);
    const businessId = await demoBusinessId();
    await CustomerModel.updateOne(
      { businessId, name: PLANNED_CUSTOMER },
      { $set: { name: 'Renamed By A Visitor' } },
    );
    await answerEveryOpenQuote(app);

    const view = await acceptAsCustomer(app, await tokenOf(app));
    expect(view.quote.customer.name).not.toBe(PLANNED_CUSTOMER);
  });
});

import type { Express } from 'express';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { InvoiceModel, QuoteModel } from '../models';
import { type SignedInClient, bearer, createAuthTestApp, registerOwner } from '../test/auth';
import { TEST_DATABASE_URI, useTestDatabase } from '../test/database';
import { errorOf } from '../test/helpers';
import { invoiceInput, paymentInput, quoteInput } from '../test/model-fixtures';
import { generatePublicToken } from '../utils/tokens';
import { USER_PDF_RATE_LIMIT } from './pdf.routes';

type BinaryCallback = (error: Error | null, body: Buffer) => void;

/** Collects the raw response body, which supertest would otherwise not buffer for a PDF. */
function binary(res: request.Response, callback: BinaryCallback): void {
  const chunks: Buffer[] = [];
  res.on('data', (chunk: Buffer) => chunks.push(chunk));
  res.on('end', () => callback(null, Buffer.concat(chunks)));
}

async function createDocuments({ session }: SignedInClient, status = 'sent') {
  const owner = { businessId: session.business.id, createdBy: session.user.id };
  const quote = await QuoteModel.create(
    quoteInput({
      ...owner,
      status,
      currency: 'NGN',
      customer: { name: 'Chiamaka Ọkafọ̀r', email: 'chiamaka@example.com' },
      publicToken: generatePublicToken(),
    }),
  );
  const invoice = await InvoiceModel.create(
    invoiceInput({
      ...owner,
      status: status === 'draft' ? 'draft' : 'partially_paid',
      invoiceNumber: `INV-${status}`,
      payments: status === 'draft' ? [] : [paymentInput({ amount: 1_000 })],
      publicToken: generatePublicToken(),
    }),
  );
  return { quote, invoice };
}

function expectPdf(res: request.Response, fileName: string): void {
  expect(res.status).toBe(200);
  expect(res.headers['content-type']).toBe('application/pdf');
  expect(res.headers['content-disposition']).toBe(`attachment; filename="${fileName}"`);
  expect(res.headers['cache-control']).toBe('no-store');
  const body = res.body as Buffer;
  expect(body.subarray(0, 5).toString('latin1')).toBe('%PDF-');
  expect(body.length).toBeGreaterThan(10_000);
}

const download = (app: Express, path: string, accessToken?: string) => {
  const req = request(app).get(path).buffer(true).parse(binary);
  return accessToken ? req.set('Authorization', bearer(accessToken)) : req;
};

describe.skipIf(!TEST_DATABASE_URI)('PDF routes (database)', () => {
  useTestDatabase();

  it('downloads the business own quote and invoice', async () => {
    const app = createAuthTestApp();
    const owner = await registerOwner(app);
    const { quote, invoice } = await createDocuments(owner);
    const token = owner.session.accessToken;

    expectPdf(await download(app, `/api/quotes/${quote.id}/pdf`, token), 'QT-0001.pdf');
    expectPdf(await download(app, `/api/invoices/${invoice.id}/pdf`, token), 'INV-sent.pdf');
  });

  it('requires authentication for business-side downloads', async () => {
    const app = createAuthTestApp();
    const owner = await registerOwner(app);
    const { quote } = await createDocuments(owner);

    const res = await request(app).get(`/api/quotes/${quote.id}/pdf`);

    expect(res.status).toBe(401);
  });

  it("returns 404 for another business's documents and unknown ids", async () => {
    const app = createAuthTestApp();
    const owner = await registerOwner(app);
    const other = await registerOwner(app);
    const { quote, invoice } = await createDocuments(owner);
    const token = other.session.accessToken;

    for (const path of [
      `/api/quotes/${quote.id}/pdf`,
      `/api/invoices/${invoice.id}/pdf`,
      '/api/quotes/0123456789abcdef01234567/pdf',
      '/api/invoices/not-an-id/pdf',
    ]) {
      const res = await request(app).get(path).set('Authorization', bearer(token));
      expect(res.status, path).toBe(404);
      expect(errorOf(res).code).toBe('NOT_FOUND');
    }
  });

  it('serves sent documents through their public links without signing in', async () => {
    const app = createAuthTestApp();
    const owner = await registerOwner(app);
    const { quote, invoice } = await createDocuments(owner);

    expectPdf(await download(app, `/api/public/quotes/${quote.publicToken}/pdf`), 'QT-0001.pdf');
    expectPdf(
      await download(app, `/api/public/invoices/${invoice.publicToken}/pdf`),
      'INV-sent.pdf',
    );
  });

  it('never exposes drafts, unknown tokens or malformed tokens publicly', async () => {
    const app = createAuthTestApp();
    const owner = await registerOwner(app);
    const { quote, invoice } = await createDocuments(owner, 'draft');

    for (const path of [
      `/api/public/quotes/${quote.publicToken}/pdf`,
      `/api/public/invoices/${invoice.publicToken}/pdf`,
      `/api/public/quotes/${generatePublicToken()}/pdf`,
      '/api/public/invoices/short-token/pdf',
    ]) {
      const res = await request(app).get(path);
      expect(res.status, path).toBe(404);
      expect(res.headers['cache-control']).toBe('no-store');
    }
  });

  it('limits business-side downloads per user', async () => {
    const app = createAuthTestApp();
    const owner = await registerOwner(app);
    const other = await registerOwner(app);
    const path = '/api/quotes/0123456789abcdef01234567/pdf';
    const get = (accessToken: string) =>
      request(app).get(path).set('Authorization', bearer(accessToken));

    for (let attempt = 0; attempt < USER_PDF_RATE_LIMIT.limit; attempt += 1) {
      await get(owner.session.accessToken).expect(404);
    }
    const limited = await get(owner.session.accessToken).expect(429);

    expect(errorOf(limited).code).toBe('RATE_LIMITED');
    await get(other.session.accessToken).expect(404);
  });

  it('still lets the business download its own drafts', async () => {
    const app = createAuthTestApp();
    const owner = await registerOwner(app);
    const { quote } = await createDocuments(owner, 'draft');

    expectPdf(
      await download(app, `/api/quotes/${quote.id}/pdf`, owner.session.accessToken),
      'QT-0001.pdf',
    );
  });
});

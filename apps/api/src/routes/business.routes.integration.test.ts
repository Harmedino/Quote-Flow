import type { BusinessDto } from '@quoteflow/shared';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { BusinessModel } from '../models';
import { addUser, bearer, createAuthTestApp, registerOwner } from '../test/auth';
import { TEST_DATABASE_URI, useTestDatabase } from '../test/database';
import { dataOf, errorOf } from '../test/helpers';

const FULL_SETTINGS = {
  name: 'Sparkle Cleaning & Co.',
  email: 'Hello@Sparkle.example',
  phone: '+234 803 555 0101',
  website: 'sparkle.example',
  address: { line1: '12 Marina Rd', line2: 'Floor 3', city: 'Lagos', country: 'Nigeria' },
  currency: 'NGN',
  timezone: 'Africa/Lagos',
  brandColor: '#1D4ED8',
  quotePrefix: 'sc-q',
  invoicePrefix: 'sc-inv',
  quoteValidityDays: 30,
  invoiceDueDays: 0,
  defaultTaxRate: 7.5,
  defaultQuoteNotes: 'Thanks for choosing us.',
  defaultQuoteTerms: '50% deposit to book.',
  defaultInvoiceNotes: 'Pay by bank transfer.',
  defaultInvoiceTerms: 'Due on receipt.',
};

describe.skipIf(!TEST_DATABASE_URI)('business routes (database)', () => {
  useTestDatabase();

  const patch = (app: ReturnType<typeof createAuthTestApp>, accessToken: string, body: object) =>
    request(app).patch('/api/business').set('Authorization', bearer(accessToken)).send(body);

  it('GET returns the business of the signed-in user', async () => {
    const app = createAuthTestApp();
    const { session } = await registerOwner(app);

    const res = await request(app)
      .get('/api/business')
      .set('Authorization', bearer(session.accessToken));

    expect(res.status).toBe(200);
    expect(res.headers['cache-control']).toBe('no-store');
    expect(dataOf<BusinessDto>(res)).toEqual(session.business);
    expect(session.business).toMatchObject({
      phone: null,
      website: null,
      logoUrl: null,
      address: {},
    });
  });

  it('PATCH lets the owner change every setting, normalised', async () => {
    const app = createAuthTestApp();
    const { session } = await registerOwner(app);

    const res = await patch(app, session.accessToken, FULL_SETTINGS);

    expect(res.status).toBe(200);
    const updated = dataOf<BusinessDto>(res);
    expect(updated).toEqual({
      ...session.business,
      ...FULL_SETTINGS,
      email: 'hello@sparkle.example',
      website: 'https://sparkle.example',
      brandColor: '#1d4ed8',
      quotePrefix: 'SC-Q',
      invoicePrefix: 'SC-INV',
      updatedAt: updated.updatedAt,
    });
    expect(Date.parse(updated.updatedAt)).toBeGreaterThanOrEqual(
      Date.parse(session.business.updatedAt),
    );

    const reread = await request(app)
      .get('/api/business')
      .set('Authorization', bearer(session.accessToken));
    expect(dataOf(reread)).toEqual(updated);
  });

  it("PATCH leaves omitted fields alone and clears optional ones sent as ''", async () => {
    const app = createAuthTestApp();
    const { session } = await registerOwner(app);
    await patch(app, session.accessToken, FULL_SETTINGS).expect(200);

    const res = await patch(app, session.accessToken, {
      email: '',
      phone: '',
      website: '',
      defaultQuoteNotes: '',
      defaultInvoiceTerms: '  ',
      address: { line2: '', city: 'Abuja' },
    });

    expect(res.status).toBe(200);
    expect(dataOf<BusinessDto>(res)).toMatchObject({
      name: FULL_SETTINGS.name,
      currency: 'NGN',
      email: null,
      phone: null,
      website: null,
      defaultQuoteNotes: null,
      defaultQuoteTerms: FULL_SETTINGS.defaultQuoteTerms,
      defaultInvoiceTerms: null,
      address: { line1: '12 Marina Rd', city: 'Abuja', country: 'Nigeria' },
    });
    const stored = await BusinessModel.findById(session.business.id).lean();
    expect(stored).not.toHaveProperty('email');
    expect(stored).not.toHaveProperty('defaultQuoteNotes');
  });

  it('PATCH reports invalid settings as field errors and changes nothing', async () => {
    const app = createAuthTestApp();
    const { session } = await registerOwner(app);

    const res = await patch(app, session.accessToken, {
      name: 'Valid Name',
      email: 'not-an-email',
      brandColor: 'teal',
      quotePrefix: 'QT--',
      quoteValidityDays: 0,
      defaultTaxRate: 7.125,
      currency: 'XYZ',
    });

    expect(res.status).toBe(400);
    expect(errorOf(res)).toMatchObject({ code: 'VALIDATION_ERROR' });
    expect(
      errorOf(res)
        .details?.map((detail) => detail.path)
        .sort(),
    ).toEqual([
      'brandColor',
      'currency',
      'defaultTaxRate',
      'email',
      'quotePrefix',
      'quoteValidityDays',
    ]);
    expect((await BusinessModel.findById(session.business.id))?.name).toBe(session.business.name);
  });

  it('PATCH is for owners only: staff get 403 but can read the settings', async () => {
    const app = createAuthTestApp();
    const { session } = await registerOwner(app);
    const staff = await addUser(app, session.business.id, 'staff');

    const res = await patch(app, staff.session.accessToken, { name: 'Staff Takeover' });

    expect(res.status).toBe(403);
    expect(errorOf(res).code).toBe('FORBIDDEN');
    const read = await request(app)
      .get('/api/business')
      .set('Authorization', bearer(staff.session.accessToken));
    expect(dataOf<BusinessDto>(read).name).toBe(session.business.name);
  });

  it('keeps every business to its own settings', async () => {
    const app = createAuthTestApp();
    const a = await registerOwner(app, { businessName: 'Business A' });
    const b = await registerOwner(app, { businessName: 'Business B' });

    const readA = await request(app)
      .get('/api/business')
      .set('Authorization', bearer(a.session.accessToken));
    const readB = await request(app)
      .get('/api/business')
      .set('Authorization', bearer(b.session.accessToken));
    expect(dataOf<BusinessDto>(readA).id).toBe(a.session.business.id);
    expect(dataOf<BusinessDto>(readB).id).toBe(b.session.business.id);

    // Identifiers in the body are ignored: the business always comes from the token.
    const res = await patch(app, a.session.accessToken, {
      id: b.session.business.id,
      businessId: b.session.business.id,
      name: 'Renamed A',
    });

    expect(res.status).toBe(200);
    expect(dataOf<BusinessDto>(res)).toMatchObject({
      id: a.session.business.id,
      name: 'Renamed A',
    });
    expect((await BusinessModel.findById(b.session.business.id))?.name).toBe('Business B');
  });

  it('requires an access token', async () => {
    const app = createAuthTestApp();

    await request(app).get('/api/business').expect(401);
    await request(app).patch('/api/business').send({ name: 'X' }).expect(401);
  });
});

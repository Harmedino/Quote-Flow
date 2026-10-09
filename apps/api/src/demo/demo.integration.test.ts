import { describe, expect, it, vi } from 'vitest';
import {
  BusinessModel,
  CounterModel,
  CustomerModel,
  InvoiceModel,
  QuoteModel,
  SessionModel,
  UserModel,
} from '../models';
import { nextDocumentNumber } from '../services/numbering.service';
import { TEST_DATABASE_URI, useTestDatabase } from '../test/database';
import { DEMO_BUSINESS, DEMO_USERS } from './data/business';
import { QUOTE_PLANS, STANDALONE_INVOICE_PLANS } from './data/documents';
import { createSeedClock } from './clock';
import { replaceDemoBusiness } from './demo';
import { removeDemoBusiness } from './reset';

const SEED_TIMEOUT_MS = 60_000;

describe.skipIf(!TEST_DATABASE_URI)('demo seed (database)', () => {
  useTestDatabase();

  it(
    'can run repeatedly and never touches another business',
    async () => {
      const other = await BusinessModel.create({ name: 'Unrelated Plumbing Co' });
      const otherBusinessId = other._id;
      await UserModel.create({
        businessId: otherBusinessId,
        name: 'Other Owner',
        email: 'owner@unrelated.example',
        passwordHash: 'placeholder',
        role: 'owner',
      });
      await CustomerModel.create({ businessId: otherBusinessId, name: 'Other Customer' });
      await nextDocumentNumber(otherBusinessId, 'quote', 'QT');

      const first = await replaceDemoBusiness(createSeedClock(), 'placeholder-hash');
      const firstOwner = first.tenant.users.owner;
      await SessionModel.create({
        businessId: firstOwner.businessId,
        userId: firstOwner._id,
        tokenHash: 'hash-of-a-demo-refresh-token',
        lastUsedAt: new Date(),
        expiresAt: new Date(Date.now() + 60_000),
      });
      const second = await replaceDemoBusiness(createSeedClock(), 'placeholder-hash');

      expect([first.replaced, second.replaced]).toEqual([false, true]);
      expect(await BusinessModel.exists({ _id: first.tenant.business._id })).toBeNull();
      expect(await QuoteModel.countDocuments({ businessId: first.tenant.business._id })).toBe(0);
      expect(await SessionModel.countDocuments({ businessId: first.tenant.business._id })).toBe(0);
      expect(await BusinessModel.countDocuments({ name: DEMO_BUSINESS.name })).toBe(1);

      const businessId = second.tenant.business._id;
      expect(await QuoteModel.countDocuments({ businessId })).toBe(QUOTE_PLANS.length);
      const convertedCount = QUOTE_PLANS.filter((plan) => plan.invoice).length;
      expect(await InvoiceModel.countDocuments({ businessId })).toBe(
        convertedCount + STANDALONE_INVOICE_PLANS.length,
      );
      const firstQuote = await QuoteModel.findOne({ businessId }).sort({ issueDate: 1 }).lean();
      expect(firstQuote?.quoteNumber).toBe(`${DEMO_BUSINESS.quotePrefix}-0001`);

      expect(await UserModel.countDocuments({ businessId: otherBusinessId })).toBe(1);
      expect(await CustomerModel.countDocuments({ businessId: otherBusinessId })).toBe(1);
      expect(await CounterModel.findOne({ businessId: otherBusinessId }).lean()).toMatchObject({
        seq: 1,
      });
      expect(await BusinessModel.exists({ _id: otherBusinessId })).not.toBeNull();
    },
    SEED_TIMEOUT_MS,
  );

  it(
    'links every converted quote and its invoice both ways',
    async () => {
      const { tenant } = await replaceDemoBusiness(createSeedClock(), 'placeholder-hash');
      const businessId = tenant.business._id;

      const converted = await QuoteModel.find({ businessId, invoiceId: { $ne: null } }).lean();
      expect(converted).toHaveLength(QUOTE_PLANS.filter((plan) => plan.invoice).length);
      for (const quote of converted) {
        const invoice = await InvoiceModel.findOne({ businessId, _id: quote.invoiceId }).lean();
        expect(invoice).toMatchObject({ quoteId: quote._id, totals: quote.totals });
        expect(quote.status).toBe('accepted');
        expect(quote.convertedAt).toBeInstanceOf(Date);
      }
    },
    SEED_TIMEOUT_MS,
  );

  it(
    'recovers from a reset that failed part-way',
    async () => {
      const { tenant } = await replaceDemoBusiness(createSeedClock(), 'placeholder-hash');
      const oldBusinessId = tenant.business._id;

      const failure = vi
        .spyOn(CustomerModel, 'deleteMany')
        .mockRejectedValueOnce(new Error('connection lost'));
      await expect(replaceDemoBusiness(createSeedClock(), 'placeholder-hash')).rejects.toThrow(
        'connection lost',
      );
      failure.mockRestore();

      const { replaced } = await replaceDemoBusiness(createSeedClock(), 'placeholder-hash');

      expect(replaced).toBe(true);
      expect(await BusinessModel.countDocuments({ name: DEMO_BUSINESS.name })).toBe(1);
      expect(await BusinessModel.exists({ _id: oldBusinessId })).toBeNull();
      expect(await CustomerModel.countDocuments({ businessId: oldBusinessId })).toBe(0);
      expect(await QuoteModel.countDocuments({ businessId: oldBusinessId })).toBe(0);
      expect(await UserModel.countDocuments({ businessId: oldBusinessId })).toBe(0);
    },
    SEED_TIMEOUT_MS,
  );

  it(
    'removes demo users left behind by a partial cleanup by hand',
    async () => {
      const { tenant } = await replaceDemoBusiness(createSeedClock(), 'placeholder-hash');
      const oldBusinessId = tenant.business._id;
      // The owner and the business were deleted, but not the staff user.
      await UserModel.deleteOne({ _id: tenant.users.owner._id, businessId: oldBusinessId });
      await BusinessModel.deleteOne({ _id: oldBusinessId });

      const { tenant: rebuilt } = await replaceDemoBusiness(createSeedClock(), 'placeholder-hash');

      const businessId = rebuilt.business._id;
      expect(await UserModel.countDocuments({ businessId: oldBusinessId })).toBe(0);
      expect(await CustomerModel.countDocuments({ businessId: oldBusinessId })).toBe(0);
      expect(await UserModel.countDocuments({ businessId })).toBe(2);
      expect(await QuoteModel.countDocuments({ businessId })).toBe(QUOTE_PLANS.length);
    },
    SEED_TIMEOUT_MS,
  );

  it(
    'replaces a business holding a demo email even when it is not marked as the demo',
    async () => {
      await removeDemoBusiness();
      // E.g. a demo from before the flag, saved since (which stores the default `false`).
      const business = await BusinessModel.create({ name: 'Not The Demo', isDemo: false });
      await UserModel.create({
        ...DEMO_USERS.staff,
        businessId: business._id,
        passwordHash: 'placeholder',
      });

      const { tenant } = await replaceDemoBusiness(createSeedClock(), 'placeholder-hash');

      expect(await BusinessModel.exists({ _id: business._id })).toBeNull();
      expect(await UserModel.countDocuments({ businessId: business._id })).toBe(0);
      expect(tenant.business.isDemo).toBe(true);
      expect(await UserModel.countDocuments({ businessId: tenant.business._id })).toBe(2);
    },
    SEED_TIMEOUT_MS,
  );
});

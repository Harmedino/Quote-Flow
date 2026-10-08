import { Types } from 'mongoose';
import { beforeAll, describe, expect, it } from 'vitest';
import { TEST_DATABASE_URI, recordCommands, useTestDatabase } from '../../test/database';
import { quoteInput } from '../../test/model-fixtures';
import { type CustomerDocument, CustomerModel } from '../customer.model';
import { QuoteModel } from '../quote.model';
import { TenantGuardError } from './tenant-guard';

describe.skipIf(!TEST_DATABASE_URI)('tenant isolation (database)', () => {
  useTestDatabase();

  const businessA = new Types.ObjectId();
  const businessB = new Types.ObjectId();
  let customerA: CustomerDocument;
  let customerB: CustomerDocument;

  beforeAll(async () => {
    // Same name and email in both businesses: nothing but businessId tells them apart.
    const details = { name: 'Olivia Harper', email: 'olivia.harper@example.com' };
    customerA = await CustomerModel.create({ ...details, businessId: businessA });
    customerB = await CustomerModel.create({ ...details, businessId: businessB });
  });

  it('only returns the current business’s documents', async () => {
    const found = await CustomerModel.find({ businessId: businessA, name: 'Olivia Harper' });
    expect(found.map((customer) => customer.id)).toEqual([customerA.id]);
    expect(await CustomerModel.countDocuments({ businessId: businessB })).toBe(1);
  });

  it('cannot read, change or delete another business’s document by id', async () => {
    const crossTenant = { _id: customerB._id, businessId: businessA };

    expect(await CustomerModel.findOne(crossTenant)).toBeNull();
    expect(
      await CustomerModel.updateOne(crossTenant, { $set: { name: 'Hijacked' } }),
    ).toMatchObject({
      matchedCount: 0,
    });
    expect(await CustomerModel.deleteOne(crossTenant)).toMatchObject({ deletedCount: 0 });

    const untouched = await CustomerModel.findOne({ _id: customerB._id, businessId: businessB });
    expect(untouched?.name).toBe('Olivia Harper');
  });

  it('rejects unscoped queries before anything is sent to the server', async () => {
    const commands = await recordCommands(async () => {
      await expect(
        CustomerModel.find({ email: 'olivia.harper@example.com' }),
      ).rejects.toBeInstanceOf(TenantGuardError);
      await expect(CustomerModel.findById(customerA._id)).rejects.toBeInstanceOf(TenantGuardError);
      await expect(CustomerModel.estimatedDocumentCount()).rejects.toBeInstanceOf(TenantGuardError);
    });
    expect(commands).toEqual([]);
  });

  it('rejects aggregations that reach other collections before anything is sent', async () => {
    const commands = await recordCommands(async () => {
      await expect(
        QuoteModel.aggregate([{ $match: { businessId: businessA } }, { $unionWith: 'customers' }]),
      ).rejects.toBeInstanceOf(TenantGuardError);
      await expect(
        QuoteModel.aggregate([
          { $match: { businessId: businessA } },
          {
            $lookup: { from: 'customers', localField: 'customerId', foreignField: '_id', as: 'c' },
          },
        ]),
      ).rejects.toBeInstanceOf(TenantGuardError);
      await expect(
        QuoteModel.aggregate([{ $match: { businessId: businessA } }, { $out: 'stolen' }]),
      ).rejects.toBeInstanceOf(TenantGuardError);
    });
    expect(commands.filter((command) => command.name === 'aggregate')).toEqual([]);
  });

  it('allows deliberate cross-tenant lookups without sending the opt-out to the server', async () => {
    const commands = await recordCommands(async () => {
      const everyone = await CustomerModel.find({ email: 'olivia.harper@example.com' }, null, {
        skipTenantGuard: true,
      });
      expect(everyone).toHaveLength(2);
    });
    expect(commands).toHaveLength(1);
    expect(JSON.stringify(commands[0]?.command)).not.toContain('skipTenantGuard');
  });

  it('scopes saves and deletes of loaded documents to their own business', async () => {
    const customer = await CustomerModel.findOne({ _id: customerA._id, businessId: businessA });
    if (!customer) throw new Error('customer A is missing');

    const commands = await recordCommands(async () => {
      customer.notes = 'Gate code 4512';
      await customer.save();
      await customer.deleteOne();
    });

    const filters = commands.flatMap(({ name, command }) => {
      const statements = (command.updates ?? command.deletes) as { q: unknown }[] | undefined;
      return name === 'update' || name === 'delete' ? (statements ?? []).map(({ q }) => q) : [];
    });
    expect(filters).toHaveLength(2);
    for (const filter of filters) {
      expect(filter).toMatchObject({ _id: customerA._id, businessId: businessA });
    }
  });

  it('populates references only within the business', async () => {
    const owned = await CustomerModel.create({ name: 'Grace Okafor', businessId: businessA });
    // QT-0002 holds a forged reference to another business's customer, which must never resolve.
    const references = [owned._id, customerB._id];
    for (const [index, customerId] of references.entries()) {
      const quoteNumber = `QT-000${index + 1}`;
      await QuoteModel.create(quoteInput({ businessId: businessA, customerId, quoteNumber }));
    }

    await expect(
      QuoteModel.find({ businessId: businessA }).populate('customerId'),
    ).rejects.toBeInstanceOf(TenantGuardError);

    const quotes = await QuoteModel.find({ businessId: businessA })
      .populate<{ customerId: CustomerDocument | null }>({
        path: 'customerId',
        match: { businessId: businessA },
      })
      .sort({ quoteNumber: 1 });
    expect(quotes.map((quote) => quote.customerId?.name ?? null)).toEqual(['Grace Okafor', null]);
  });
});

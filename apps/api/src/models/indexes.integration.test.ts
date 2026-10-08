import { Types } from 'mongoose';
import { describe, expect, it } from 'vitest';
import { isDuplicateKeyError } from '../db/errors';
import { TEST_DATABASE_URI, isUnsupportedIndexOption, useTestDatabase } from '../test/database';
import { invoiceInput, quoteInput } from '../test/model-fixtures';
import { InvoiceModel } from './invoice.model';
import { QuoteModel } from './quote.model';
import { UserModel } from './user.model';

const PARTIAL_INDEX_UNSUPPORTED =
  'This MongoDB stand-in does not implement partial indexes; run against MongoDB to cover this.';

describe.skipIf(!TEST_DATABASE_URI)('declared indexes (database)', () => {
  const database = useTestDatabase();
  const invoiceIndexReport = () =>
    database.indexReports().find((report) => report.model === InvoiceModel.modelName);

  it('builds every declared index', () => {
    for (const report of database.indexReports()) {
      // A stand-in's unsupported index option is covered (and skipped) by the partial index tests.
      if (isUnsupportedIndexOption(report)) continue;
      expect(report).toEqual({ model: report.model, missing: [], undeclared: [] });
    }
  });

  it('keeps quote numbers unique within a business but not across businesses', async () => {
    const [businessA, businessB] = [new Types.ObjectId(), new Types.ObjectId()];
    await QuoteModel.create(quoteInput({ businessId: businessA, quoteNumber: 'QT-0001' }));

    await expect(
      QuoteModel.create(quoteInput({ businessId: businessA, quoteNumber: 'QT-0001' })),
    ).rejects.toSatisfy(isDuplicateKeyError);
    await expect(
      QuoteModel.create(quoteInput({ businessId: businessB, quoteNumber: 'QT-0001' })),
    ).resolves.toBeDefined();
  });

  it('keeps invoice numbers unique within a business', async () => {
    const businessId = new Types.ObjectId();
    await InvoiceModel.create(invoiceInput({ businessId, invoiceNumber: 'INV-0001' }));
    await expect(
      InvoiceModel.create(invoiceInput({ businessId, invoiceNumber: 'INV-0001' })),
    ).rejects.toSatisfy(isDuplicateKeyError);
  });

  it('keeps public tokens unique across all businesses', async () => {
    const quote = await QuoteModel.create(quoteInput());
    await expect(
      QuoteModel.create(quoteInput({ publicToken: quote.publicToken })),
    ).rejects.toSatisfy(isDuplicateKeyError);

    const invoice = await InvoiceModel.create(invoiceInput());
    await expect(
      InvoiceModel.create(invoiceInput({ publicToken: invoice.publicToken })),
    ).rejects.toSatisfy(isDuplicateKeyError);
  });

  it('allows one login per email across all businesses', async () => {
    const user = { name: 'Maya Robinson', email: 'maya@example.com', passwordHash: 'placeholder' };
    await UserModel.create({ ...user, businessId: new Types.ObjectId() });
    await expect(
      UserModel.create({ ...user, email: 'MAYA@example.com', businessId: new Types.ObjectId() }),
    ).rejects.toSatisfy(isDuplicateKeyError);
  });

  it('never converts a quote into two invoices, even concurrently', async (context) => {
    context.skip(isUnsupportedIndexOption(invoiceIndexReport()), PARTIAL_INDEX_UNSUPPORTED);
    const businessId = new Types.ObjectId();
    const quoteId = new Types.ObjectId();

    const attempts = await Promise.allSettled(
      ['INV-0001', 'INV-0002'].map((invoiceNumber) =>
        InvoiceModel.create(invoiceInput({ businessId, quoteId, invoiceNumber })),
      ),
    );

    expect(attempts.filter((attempt) => attempt.status === 'fulfilled')).toHaveLength(1);
    const [rejected] = attempts.filter((attempt) => attempt.status === 'rejected');
    expect(isDuplicateKeyError(rejected?.reason)).toBe(true);
  });

  it('allows any number of invoices that were not converted from a quote', async (context) => {
    context.skip(isUnsupportedIndexOption(invoiceIndexReport()), PARTIAL_INDEX_UNSUPPORTED);
    const businessId = new Types.ObjectId();

    await InvoiceModel.create(invoiceInput({ businessId, invoiceNumber: 'INV-0001' }));
    await InvoiceModel.create(
      invoiceInput({ businessId, invoiceNumber: 'INV-0002', quoteId: null }),
    );
    expect(await InvoiceModel.countDocuments({ businessId, quoteId: null })).toBe(2);
  });
});

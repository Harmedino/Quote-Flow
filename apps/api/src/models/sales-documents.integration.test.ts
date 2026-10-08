import mongoose, { Types } from 'mongoose';
import { describe, expect, it } from 'vitest';
import { TEST_DATABASE_URI, useTestDatabase } from '../test/database';
import { invoiceInput, paymentInput, quoteInput } from '../test/model-fixtures';
import { InvoiceModel } from './invoice.model';
import { AtomicUpdateGuardError } from './plugins/atomic-update-guard';
import { QuoteModel } from './quote.model';

describe.skipIf(!TEST_DATABASE_URI)('quotes and invoices (database)', () => {
  useTestDatabase();

  it('stores derived totals and reads them back unchanged', async () => {
    const created = await QuoteModel.create(
      quoteInput({ discount: { type: 'percentage', value: 10 }, taxRate: 8.25 }),
    );
    const stored = await QuoteModel.findOne({
      _id: created._id,
      businessId: created.businessId,
    }).lean();

    // 2.5 × 5,500 = 13,750 − 1,375 = 12,375 + 8.25% (1,020.9375 → 1,021) = 13,396.
    expect(stored?.totals).toEqual({
      subtotal: 13_750,
      discount: 1_375,
      tax: 1_021,
      total: 13_396,
    });
    expect(stored?.items[0]?.amount).toBe(13_750);
  });

  it('rejects a save from a stale copy instead of overwriting derived fields', async () => {
    const { _id, businessId } = await InvoiceModel.create(invoiceInput());
    const [first, second] = await Promise.all([
      InvoiceModel.findOne({ _id, businessId }),
      InvoiceModel.findOne({ _id, businessId }),
    ]);
    if (!first || !second) throw new Error('invoice is missing');

    first.payments.push(paymentInput({ amount: 5_000 }));
    await first.save();
    second.payments.push(paymentInput({ amount: 6_000 }));
    await expect(second.save()).rejects.toBeInstanceOf(mongoose.Error.VersionError);

    const stored = await InvoiceModel.findOne({ _id, businessId }).lean();
    expect(stored).toMatchObject({ amountPaid: 5_000, balanceDue: 8_750 });
    expect(stored?.payments).toHaveLength(1);
  });

  it('stamps payments with their own id and creation time', async () => {
    const invoice = await InvoiceModel.create(invoiceInput({ payments: [paymentInput()] }));
    const [payment] = invoice.toJSON().payments;
    expect(payment).toHaveProperty('id', invoice.payments[0]?._id.toHexString());
    expect(payment?.createdAt).toBeInstanceOf(Date);
  });

  it('rejects atomic updates that would bypass derived totals and payment sums', async () => {
    const { _id, businessId } = await InvoiceModel.create(invoiceInput());
    const filter = { _id, businessId };

    for (const options of [{}, { allowAtomicUpdate: true }]) {
      await expect(
        InvoiceModel.updateOne(filter, { $set: { 'items.0.quantity': 10 } }).setOptions(options),
      ).rejects.toBeInstanceOf(AtomicUpdateGuardError);
      await expect(
        InvoiceModel.updateOne(filter, { $push: { payments: paymentInput() } }).setOptions(options),
      ).rejects.toBeInstanceOf(AtomicUpdateGuardError);
    }

    const stored = await InvoiceModel.findOne(filter).lean();
    expect(stored).toMatchObject({ amountPaid: 0, balanceDue: 13_750, payments: [] });
    expect(stored?.items[0]?.quantity).toBe(2.5);
  });

  it('makes a stale save fail after an allowed atomic update', async () => {
    const { _id, businessId } = await QuoteModel.create(quoteInput({ status: 'sent' }));
    const stale = await QuoteModel.findOne({ _id, businessId });
    if (!stale) throw new Error('quote is missing');

    const accepted = await QuoteModel.updateOne(
      { _id, businessId, status: 'sent' },
      { $set: { status: 'accepted', acceptedAt: new Date() } },
    ).setOptions({ allowAtomicUpdate: true });
    expect(accepted.modifiedCount).toBe(1);

    stale.status = 'draft';
    await expect(stale.save()).rejects.toBeInstanceOf(mongoose.Error.VersionError);
    expect(await QuoteModel.findOne({ _id, businessId }).lean()).toMatchObject({
      status: 'accepted',
      __v: 1,
    });
  });

  it('never changes the quote an invoice was converted from', async () => {
    const quoteId = new Types.ObjectId();
    const invoice = await InvoiceModel.create(invoiceInput({ quoteId }));

    invoice.quoteId = null;
    invoice.invoiceNumber = 'INV-9999';
    await invoice.save();

    const stored = await InvoiceModel.findOne({ _id: invoice._id, businessId: invoice.businessId });
    expect(stored?.quoteId).toEqual(quoteId);
    expect(stored?.invoiceNumber).toBe('INV-0001');
  });
});

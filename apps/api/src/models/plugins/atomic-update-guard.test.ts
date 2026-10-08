import mongoose, { type Model, type Query, Schema, Types } from 'mongoose';
import { describe, expect, it } from 'vitest';
import { InvoiceModel } from '../invoice.model';
import { QuoteModel } from '../quote.model';
import { AtomicUpdateGuardError, atomicUpdateGuard } from './atomic-update-guard';

/**
 * Thrown by hooks registered after the guard: reaching one proves the guard let
 * the operation through (with the update it ended up with), without a database.
 */
class ReachedDatabase extends Error {
  constructor(readonly update?: unknown) {
    super('The operation passed the atomic update guard');
  }
}

const UPDATE_OPERATIONS = ['updateOne', 'updateMany', 'findOneAndUpdate'] as const;

const schema = new Schema(
  {
    status: String,
    notes: String,
    items: [{ name: String, quantity: Number }],
    totals: { total: Number },
    payments: [{ amount: Number }],
    amountPaid: Number,
  },
  { bufferCommands: false },
);
schema.plugin(atomicUpdateGuard);
for (const operation of [...UPDATE_OPERATIONS, 'replaceOne', 'findOneAndReplace'] as const) {
  schema.pre(operation, function (this: Query<unknown, unknown>) {
    throw new ReachedDatabase(this.getUpdate());
  });
}
schema.pre('bulkWrite', function (this: Model<unknown>, operations: unknown) {
  throw new ReachedDatabase(operations);
});

// Loosely typed: the tests write paths the schema does not declare, as callers could.
const Doc = mongoose.model<Record<string, unknown>>('AtomicUpdateGuardTestDoc', schema);

type Update = Record<string, unknown>;

const updates: Record<
  (typeof UPDATE_OPERATIONS)[number],
  (update: Update, options?: Record<string, unknown>) => Promise<unknown>
> = {
  updateOne: (update, options = {}) => Doc.updateOne({}, update).setOptions(options).exec(),
  updateMany: (update, options = {}) => Doc.updateMany({}, update).setOptions(options).exec(),
  findOneAndUpdate: (update, options = {}) =>
    Doc.findOneAndUpdate({}, update).setOptions(options).exec(),
};

async function expectBlocked(operation: Promise<unknown>): Promise<void> {
  await expect(operation).rejects.toBeInstanceOf(AtomicUpdateGuardError);
}

async function reachedWith(operation: Promise<unknown>): Promise<unknown> {
  const error: unknown = await operation.then(
    () => undefined,
    (rejection: unknown) => rejection,
  );
  expect(error).toBeInstanceOf(ReachedDatabase);
  return (error as ReachedDatabase).update;
}

const ALLOW = { allowAtomicUpdate: true };

describe('atomicUpdateGuard', () => {
  describe.each(Object.entries(updates))('%s', (_name, run) => {
    it('is rejected unless the query opts in', async () => {
      await expectBlocked(run({ $set: { status: 'expired' } }));
      await expectBlocked(run({ $set: { status: 'expired' } }, { allowAtomicUpdate: false }));
    });

    it('cannot be bypassed with the generic middleware: false option', async () => {
      await expectBlocked(run({ $set: { status: 'expired' } }, { middleware: false }));
    });

    it.each([
      ['an item field', { $set: { 'items.0.quantity': 10 } }],
      ['a payment push', { $push: { payments: { amount: 5_000 } } }],
      ['the totals', { $set: { totals: { total: 1 } } }],
      ['a total', { $set: { 'totals.total': 1 } }],
      ['amountPaid', { $inc: { amountPaid: 1 } }],
      ['balanceDue', { $set: { balanceDue: 0 } }],
      ['the discount', { $unset: { discount: 1 } }],
      ['the currency, assigned directly', { currency: 'EUR' }],
      ['the tax rate, as a rename target', { $rename: { notes: 'taxRate' } }],
      ['the items, as a rename source', { $rename: { items: 'lines' } }],
    ])('rejects an opted-in update of %s', async (_label, update) => {
      await expectBlocked(run(update, ALLOW));
    });

    it('accepts an opted-in update of other fields and increments the version', async () => {
      expect(await reachedWith(run({ $set: { status: 'expired' } }, ALLOW))).toEqual({
        $set: { status: 'expired' },
        $inc: { __v: 1 },
      });
      expect(
        await reachedWith(run({ status: 'viewed', $inc: { viewCount: 1 } }, ALLOW)),
      ).toMatchObject({ status: 'viewed', $inc: { viewCount: 1, __v: 1 } });
    });
  });

  it.each(Object.entries(updates))(
    'rejects an opted-in %s that upserts or overwrites immutable fields',
    async (_name, run) => {
      const update = { $set: { status: 'expired' } };
      await expectBlocked(run(update, { ...ALLOW, upsert: true }));
      await expectBlocked(run(update, { ...ALLOW, overwriteImmutable: true }));
    },
  );

  it('rejects update pipelines even when opted in', async () => {
    await expectBlocked(
      Doc.updateOne({}, [{ $set: { status: 'x' } }], { updatePipeline: true })
        .setOptions(ALLOW)
        .exec(),
    );
  });

  it.each([
    ['replaceOne', () => Doc.replaceOne({}, { status: 'x' }).setOptions(ALLOW).exec()],
    [
      'findOneAndReplace',
      () => Doc.findOneAndReplace({}, { status: 'x' }).setOptions(ALLOW).exec(),
    ],
  ])('always rejects %s', async (_name, run) => {
    await expectBlocked(run());
  });

  describe('bulkWrite', () => {
    const setStatus = { filter: {}, update: { $set: { status: 'expired' } } };

    it('rejects updates unless opted in, and replacements always', async () => {
      await expectBlocked(Doc.bulkWrite([{ updateOne: setStatus }]));
      await expectBlocked(Doc.bulkWrite([{ updateMany: setStatus }]));
      await expectBlocked(
        Doc.bulkWrite([{ replaceOne: { filter: {}, replacement: { status: 'x' } } }], ALLOW),
      );
      await expectBlocked(
        Doc.bulkWrite(
          [{ updateOne: { filter: {}, update: { $push: { payments: { amount: 1 } } } } }],
          ALLOW,
        ),
      );
      await expectBlocked(Doc.bulkWrite([{ updateOne: { ...setStatus, upsert: true } }], ALLOW));
    });

    it('increments the version of opted-in updates', async () => {
      const operations = await reachedWith(
        Doc.bulkWrite([{ updateOne: structuredClone(setStatus) }], ALLOW),
      );
      expect(operations).toEqual([
        { updateOne: { filter: {}, update: { $set: { status: 'expired' }, $inc: { __v: 1 } } } },
      ]);
    });

    it('lets inserts and deletes through', async () => {
      await reachedWith(
        Doc.bulkWrite([
          { insertOne: { document: { status: 'draft' } } },
          { deleteOne: { filter: { status: 'draft' } } },
          { deleteMany: { filter: { status: 'draft' } } },
        ]),
      );
    });
  });
});

describe('application models', () => {
  const businessId = new Types.ObjectId();

  it('guards quotes and invoices', async () => {
    const update = { $set: { notes: 'x' } };
    await expectBlocked(QuoteModel.updateOne({ businessId }, update).exec());
    await expectBlocked(InvoiceModel.updateOne({ businessId }, update).exec());
    await expectBlocked(QuoteModel.findOneAndReplace({ businessId }, { businessId }).exec());
    await expectBlocked(InvoiceModel.findOneAndReplace({ businessId }, { businessId }).exec());
  });
});

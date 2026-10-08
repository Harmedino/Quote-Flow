import { formatDocumentNumber } from '@quoteflow/shared';
import { Types } from 'mongoose';
import { describe, expect, it } from 'vitest';
import { CounterModel } from '../models/counter.model';
import { TEST_DATABASE_URI, supportsAtomicIncrements, useTestDatabase } from '../test/database';
import { nextDocumentNumber } from './numbering.service';

describe.skipIf(!TEST_DATABASE_URI)('nextDocumentNumber (database)', () => {
  useTestDatabase();

  it('numbers each business and document kind independently', async () => {
    const [businessA, businessB] = [new Types.ObjectId(), new Types.ObjectId()];

    expect(await nextDocumentNumber(businessA, 'quote', 'QT')).toBe('QT-0001');
    expect(await nextDocumentNumber(businessA, 'quote', 'QT')).toBe('QT-0002');
    expect(await nextDocumentNumber(businessA, 'invoice', 'INV')).toBe('INV-0001');
    expect(await nextDocumentNumber(businessB, 'quote', 'EHS-Q')).toBe('EHS-Q-0001');
  });

  it('gives concurrent callers distinct, consecutive numbers', async (context) => {
    context.skip(
      !(await supportsAtomicIncrements()),
      'This MongoDB stand-in does not apply concurrent updates to one document atomically; run against MongoDB to cover this.',
    );
    const businessId = new Types.ObjectId();
    const callers = 20;

    // Every caller races to create the counter, so this also covers the first-upsert retry.
    const numbers = await Promise.all(
      Array.from({ length: callers }, () => nextDocumentNumber(businessId, 'invoice', 'INV')),
    );

    const expected = Array.from({ length: callers }, (_, index) =>
      formatDocumentNumber('INV', index + 1),
    );
    expect([...numbers].sort()).toEqual(expected);
    const counters = await CounterModel.find({ businessId }).lean();
    expect(counters).toEqual([expect.objectContaining({ key: 'invoice', seq: callers })]);
  });
});

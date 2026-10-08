import { Types } from 'mongoose';
import { describe, expect, it } from 'vitest';
import { validationErrorsOf } from '../test/model-fixtures';
import { CounterModel } from './counter.model';

describe('CounterModel', () => {
  it('starts each sequence at zero', async () => {
    const counter = new CounterModel({ businessId: new Types.ObjectId(), key: 'quote' });
    expect(await validationErrorsOf(counter)).toEqual({});
    expect(counter.seq).toBe(0);
  });

  it.each([
    ['key', { key: 'receipt' }],
    ['seq', { seq: -1 }],
    ['seq', { seq: 1.5 }],
  ])('rejects an invalid %s', async (path, overrides) => {
    const counter = new CounterModel({
      businessId: new Types.ObjectId(),
      key: 'quote',
      ...overrides,
    });
    expect(await validationErrorsOf(counter)).toHaveProperty([path]);
  });

  it('keeps one counter per business and document kind', () => {
    expect(CounterModel.schema.indexes()).toContainEqual([
      { businessId: 1, key: 1 },
      expect.objectContaining({ unique: true }),
    ]);
  });
});

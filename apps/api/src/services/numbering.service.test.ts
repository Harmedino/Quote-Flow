import mongoose, { Types } from 'mongoose';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CounterModel } from '../models/counter.model';
import { nextDocumentNumber } from './numbering.service';

type CounterQuery = ReturnType<typeof CounterModel.findOneAndUpdate>;

/** Stands in for `findOneAndUpdate(…).lean()` resolving or rejecting with `outcome`. */
function counterQuery(outcome: { seq: number } | Error): CounterQuery {
  const result = outcome instanceof Error ? Promise.reject(outcome) : Promise.resolve(outcome);
  return { lean: () => result } as unknown as CounterQuery;
}

const duplicateKey = () =>
  new mongoose.mongo.MongoServerError({ message: 'E11000 duplicate key error', code: 11000 });

afterEach(() => {
  vi.restoreAllMocks();
});

describe('nextDocumentNumber', () => {
  const businessId = new Types.ObjectId();

  it('increments the counter atomically with an upsert and formats the number', async () => {
    const update = vi
      .spyOn(CounterModel, 'findOneAndUpdate')
      .mockReturnValue(counterQuery({ seq: 42 }));

    expect(await nextDocumentNumber(businessId, 'quote', 'QT')).toBe('QT-0042');
    expect(update).toHaveBeenCalledWith(
      { businessId, key: 'quote' },
      { $inc: { seq: 1 } },
      { upsert: true, returnDocument: 'after' },
    );
  });

  it('retries once when a concurrent first upsert created the counter', async () => {
    const update = vi
      .spyOn(CounterModel, 'findOneAndUpdate')
      .mockReturnValueOnce(counterQuery(duplicateKey()))
      .mockReturnValueOnce(counterQuery({ seq: 2 }));

    expect(await nextDocumentNumber(businessId, 'invoice', 'INV')).toBe('INV-0002');
    expect(update).toHaveBeenCalledTimes(2);
  });

  it('gives up after a second duplicate-key error', async () => {
    vi.spyOn(CounterModel, 'findOneAndUpdate').mockImplementation(() =>
      counterQuery(duplicateKey()),
    );
    await expect(nextDocumentNumber(businessId, 'quote', 'QT')).rejects.toMatchObject({
      code: 11000,
    });
  });

  it('does not retry other errors', async () => {
    const update = vi
      .spyOn(CounterModel, 'findOneAndUpdate')
      .mockReturnValue(counterQuery(new Error('connection lost')));

    await expect(nextDocumentNumber(businessId, 'quote', 'QT')).rejects.toThrow('connection lost');
    expect(update).toHaveBeenCalledTimes(1);
  });
});

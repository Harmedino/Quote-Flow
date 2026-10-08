import { describe, expect, it } from 'vitest';
import { findMissingIndexes } from './indexes';

function fakeModel(modelName: string, toCreate: unknown[]) {
  return {
    modelName,
    diffIndexes: () => Promise.resolve({ toCreate, toDrop: [] }),
  } as unknown as Parameters<typeof findMissingIndexes>[0][number];
}

describe('findMissingIndexes', () => {
  it('reports only the models with declared indexes missing, as JSON', async () => {
    const result = await findMissingIndexes([
      fakeModel('Quote', [{ businessId: 1, quoteNumber: 1 }, { publicToken: 1 }]),
      fakeModel('Customer', []),
      fakeModel('Invoice', [{ quoteId: 1 }]),
    ]);

    expect(result).toEqual([
      { model: 'Quote', missing: ['{"businessId":1,"quoteNumber":1}', '{"publicToken":1}'] },
      { model: 'Invoice', missing: ['{"quoteId":1}'] },
    ]);
  });

  it('returns an empty list when every index exists', async () => {
    expect(await findMissingIndexes([fakeModel('Quote', []), fakeModel('User', [])])).toEqual([]);
  });
});

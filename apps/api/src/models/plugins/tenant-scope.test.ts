import { Types } from 'mongoose';
import { describe, expect, it } from 'vitest';
import {
  bulkOperationViolation,
  isTenantScoped,
  isTenantScopedPipeline,
  pipelineViolation,
  replacementKeepsTenant,
  updateChangesTenant,
  updateTouchesPaths,
} from './tenant-scope';

const tenant = new Types.ObjectId();
const otherTenant = new Types.ObjectId();

describe('isTenantScoped', () => {
  it.each([
    ['an ObjectId', { businessId: tenant }],
    ['a hex string id', { businessId: tenant.toHexString() }],
    ['$eq', { businessId: { $eq: tenant } }],
    ['$in with ids', { businessId: { $in: [tenant, otherTenant] } }],
    [
      'other conditions alongside',
      { _id: new Types.ObjectId(), businessId: tenant, status: 'sent' },
    ],
  ])('accepts a filter pinned by %s', (_label, filter) => {
    expect(isTenantScoped(filter)).toBe(true);
  });

  it.each([
    ['an empty filter', {}],
    ['a missing filter', undefined],
    ['null', { businessId: null }],
    ['undefined', { businessId: undefined }],
    ['a non-id string', { businessId: 'acme' }],
    ['$exists', { businessId: { $exists: true } }],
    ['$ne', { businessId: { $ne: tenant } }],
    ['$nin', { businessId: { $nin: [tenant] } }],
    ['an empty $in', { businessId: { $in: [] } }],
    ['$in with a non-id', { businessId: { $in: [tenant, null] } }],
    ['$eq combined with another operator', { businessId: { $eq: tenant, $exists: true } }],
    ['a condition nested in $or', { $or: [{ businessId: tenant }] }],
    ['a condition nested in $and', { $and: [{ businessId: tenant }] }],
    ['a misspelt field', { buisnessId: tenant }],
  ])('rejects %s', (_label, filter) => {
    expect(isTenantScoped(filter)).toBe(false);
  });
});

describe('updateChangesTenant', () => {
  it.each([
    ['a top-level assignment', { businessId: otherTenant }],
    ['$set', { $set: { businessId: otherTenant } }],
    ['$set on a nested path', { $set: { 'businessId.x': 1 } }],
    ['$unset', { $unset: { businessId: 1 } }],
    ['$setOnInsert', { $setOnInsert: { businessId: otherTenant } }],
    ['$rename away from it', { $rename: { businessId: 'formerBusinessId' } }],
    ['$rename onto it', { $rename: { name: 'businessId' } }],
    ['an aggregation pipeline', [{ $set: { name: 'x' } }]],
  ])('detects %s', (_label, update) => {
    expect(updateChangesTenant(update)).toBe(true);
  });

  it.each([
    ['null', null],
    ['$set of other fields', { $set: { name: 'x', 'customer.businessName': 'y' } }],
    ['$inc', { $inc: { seq: 1 } }],
    ['a top-level assignment of other fields', { name: 'x' }],
  ])('allows %s', (_label, update) => {
    expect(updateChangesTenant(update)).toBe(false);
  });
});

describe('updateTouchesPaths', () => {
  const isItemsPath = (path: string) => path === 'items' || path.startsWith('items.');

  it.each([
    ['a nested item field', { $set: { 'items.0.quantity': 2 } }],
    ['a push', { $push: { items: { name: 'x' } } }],
    ['a rename target', { $rename: { notes: 'items' } }],
    ['a pipeline', [{ $set: { status: 'x' } }]],
  ])('detects %s', (_label, update) => {
    expect(updateTouchesPaths(update, isItemsPath)).toBe(true);
  });

  it('ignores paths that merely share a prefix', () => {
    expect(updateTouchesPaths({ $set: { itemsCount: 2, status: 'sent' } }, isItemsPath)).toBe(
      false,
    );
  });
});

describe('replacementKeepsTenant', () => {
  it('requires the replacement to keep the single tenant the filter selects', () => {
    expect(replacementKeepsTenant({ businessId: tenant }, { businessId: tenant })).toBe(true);
    expect(
      replacementKeepsTenant({ businessId: { $eq: tenant } }, { businessId: tenant.toHexString() }),
    ).toBe(true);
  });

  it.each([
    ['moves it to another tenant', { businessId: tenant }, { businessId: otherTenant }],
    ['drops businessId', { businessId: tenant }, { name: 'x' }],
    ['has an unscoped filter', {}, { businessId: tenant }],
    ['has a multi-tenant filter', { businessId: { $in: [tenant] } }, { businessId: tenant }],
    [
      'uses an operator in the replacement',
      { businessId: tenant },
      { businessId: { $eq: tenant } },
    ],
  ])('rejects a replacement that %s', (_label, filter, replacement) => {
    expect(replacementKeepsTenant(filter, replacement)).toBe(false);
  });
});

describe('isTenantScopedPipeline', () => {
  it('requires the first stage to be a scoped $match', () => {
    expect(isTenantScopedPipeline([{ $match: { businessId: tenant } }, { $sort: { n: 1 } }])).toBe(
      true,
    );
    expect(isTenantScopedPipeline([])).toBe(false);
    expect(isTenantScopedPipeline([{ $match: { status: 'sent' } }])).toBe(false);
    expect(isTenantScopedPipeline([{ $sort: { n: 1 } }, { $match: { businessId: tenant } }])).toBe(
      false,
    );
  });
});

describe('pipelineViolation', () => {
  const scoped = [{ $match: { businessId: tenant } }];
  const lookup = (spec: Record<string, unknown>) => ({
    $lookup: { from: 'customers', as: 'customer', ...spec },
  });

  it.each([
    ['a plain pipeline', [{ $match: { businessId: tenant } }, { $group: { _id: '$status' } }]],
    ['a scoped $lookup pipeline', [lookup({ pipeline: [...scoped, { $limit: 1 }] })]],
    ['a scoped $unionWith pipeline', [{ $unionWith: { coll: 'customers', pipeline: scoped } }]],
    [
      'a $facet of safe stages',
      [{ $facet: { counts: [{ $count: 'n' }], first: [{ $limit: 1 }] } }],
    ],
    ['a scoped $lookup inside $facet', [{ $facet: { joined: [lookup({ pipeline: scoped })] } }]],
  ])('accepts %s', (_label, pipeline) => {
    expect(pipelineViolation(pipeline)).toBeUndefined();
  });

  it.each([
    ['$out', [{ $out: 'stolen' }], '$out is not allowed'],
    ['$merge', [{ $merge: { into: 'stolen' } }], '$merge is not allowed'],
    [
      '$graphLookup',
      [
        {
          $graphLookup: {
            from: 'quotes',
            startWith: '$_id',
            connectFromField: 'a',
            connectToField: 'b',
            as: 'c',
          },
        },
      ],
      '$graphLookup is not allowed',
    ],
    [
      'a localField $lookup',
      [lookup({ localField: 'customerId', foreignField: '_id' })],
      '$lookup must use a pipeline',
    ],
    ['a string $unionWith', [{ $unionWith: 'customers' }], '$unionWith must use a pipeline'],
    [
      'a $unionWith without a pipeline',
      [{ $unionWith: { coll: 'customers' } }],
      '$unionWith must use a pipeline',
    ],
    [
      'a $lookup pipeline without a businessId $match',
      [lookup({ pipeline: [{ $match: { name: 'x' } }] })],
      '$lookup must use a pipeline',
    ],
    [
      'a $lookup pipeline that matches businessId too late',
      [lookup({ pipeline: [{ $limit: 5 }, ...scoped] })],
      '$lookup must use a pipeline',
    ],
    ['$out inside $facet', [{ $facet: { a: [{ $count: 'n' }], b: [{ $out: 'x' }] } }], '$out'],
    [
      'an unscoped $lookup inside $facet',
      [{ $facet: { joined: [lookup({ localField: 'customerId', foreignField: '_id' })] } }],
      '$lookup must use a pipeline',
    ],
    [
      '$merge inside a scoped $lookup',
      [lookup({ pipeline: [...scoped, { $merge: 'x' }] })],
      '$merge',
    ],
    [
      'an unscoped $unionWith inside a scoped $lookup',
      [lookup({ pipeline: [...scoped, { $unionWith: 'users' }] })],
      '$unionWith must use a pipeline',
    ],
  ])('rejects %s', (_label, pipeline, message) => {
    expect(pipelineViolation(pipeline)).toContain(message);
  });

  it('names only the stage, never values', () => {
    const violation = pipelineViolation([
      lookup({ pipeline: [{ $match: { email: 'olivia.harper@example.com' } }] }),
    ]);
    expect(violation).toBe('$lookup must use a pipeline that starts with a $match on businessId');
  });
});

describe('bulkOperationViolation', () => {
  it('accepts operations that stay within one tenant', () => {
    for (const operation of [
      { insertOne: { document: { businessId: tenant, name: 'x' } } },
      { updateOne: { filter: { businessId: tenant }, update: { $set: { name: 'x' } } } },
      { updateMany: { filter: { businessId: tenant }, update: { $set: { name: 'x' } } } },
      { replaceOne: { filter: { businessId: tenant }, replacement: { businessId: tenant } } },
      { deleteOne: { filter: { businessId: tenant } } },
      { deleteMany: { filter: { businessId: tenant } } },
    ]) {
      expect(bulkOperationViolation(operation, true)).toBeUndefined();
    }
  });

  it.each([
    [{ insertOne: { document: { name: 'x' } } }, 'insertOne must set businessId'],
    [{ updateOne: { filter: {}, update: { $set: { name: 'x' } } } }, 'updateOne must filter'],
    [
      { updateMany: { filter: { businessId: tenant }, update: { businessId: otherTenant } } },
      'must not change',
    ],
    [{ replaceOne: { filter: { businessId: tenant }, replacement: {} } }, 'replaceOne must'],
    [{ deleteMany: { filter: {} } }, 'deleteMany must filter'],
    [{ deleteOne: {}, insertOne: {} }, 'exactly one action'],
    [{ dropCollection: {} }, 'unsupported bulkWrite operation dropCollection'],
  ])('rejects %j', (operation, message) => {
    expect(bulkOperationViolation(operation, true)).toContain(message);
  });

  it('only relaxes the filter requirement when the scope is not required', () => {
    expect(bulkOperationViolation({ deleteMany: { filter: {} } }, false)).toBeUndefined();
    expect(
      bulkOperationViolation(
        { updateMany: { filter: {}, update: { $unset: { businessId: 1 } } } },
        false,
      ),
    ).toContain('must not change businessId');
    expect(bulkOperationViolation({ insertOne: { document: {} } }, false)).toBeDefined();
  });
});

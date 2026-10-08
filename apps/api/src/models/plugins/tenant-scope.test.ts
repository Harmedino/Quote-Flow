import { Types } from 'mongoose';
import { describe, expect, it } from 'vitest';
import {
  bulkOperationViolation,
  isTenantScoped,
  isTenantScopedPipeline,
  replacementKeepsTenant,
  updateChangesTenant,
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

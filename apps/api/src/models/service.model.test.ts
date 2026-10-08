import { Types } from 'mongoose';
import { describe, expect, it } from 'vitest';
import { validationErrorsOf } from '../test/model-fixtures';
import { ServiceModel } from './service.model';

const businessId = new Types.ObjectId();

describe('ServiceModel', () => {
  it('accepts a priced service and defaults to active', async () => {
    const service = new ServiceModel({
      businessId,
      name: 'Gutter cleaning',
      unit: 'linear ft',
      price: 125,
    });
    expect(await validationErrorsOf(service)).toEqual({});
    expect(service.active).toBe(true);
  });

  it.each([
    ['name', { name: '' }],
    ['name', { name: 'x'.repeat(201) }],
    ['price', { price: 1.25 }],
    ['price', { price: -100 }],
    ['price', { price: undefined }],
    ['unit', { unit: 'x'.repeat(31) }],
    ['description', { description: 'x'.repeat(2001) }],
  ])('rejects an invalid %s', async (path, overrides) => {
    const service = new ServiceModel({
      businessId,
      name: 'Gutter cleaning',
      price: 125,
      ...overrides,
    });
    expect(await validationErrorsOf(service)).toHaveProperty([path]);
  });

  it('declares an index for listing active services by name', () => {
    expect(ServiceModel.schema.indexes().map(([fields]) => fields)).toContainEqual({
      businessId: 1,
      active: 1,
      name: 1,
    });
  });
});

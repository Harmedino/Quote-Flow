import mongoose, { type Schema } from 'mongoose';
import { describe, expect, it } from 'vitest';
import { ALL_MODELS, BusinessModel, TENANT_MODELS } from './index';
import { isTenantGuarded } from './plugins/tenant-guard';

/**
 * The registries drive production index builds, the seed reset and the guard
 * and serialization tests, so a model missing from them must fail loudly.
 */
describe('model registries', () => {
  const allModels: readonly { modelName: string; schema: Schema }[] = ALL_MODELS;
  const tenantModels: ReadonlySet<unknown> = new Set(TENANT_MODELS);

  it('ALL_MODELS lists every registered model', () => {
    expect(new Set(mongoose.modelNames())).toEqual(
      new Set(allModels.map((model) => model.modelName)),
    );
  });

  it.each(
    allModels
      .filter((model) => model.schema.path('businessId'))
      .map((model) => [model.modelName, model] as const),
  )('%s has a businessId, so it is in TENANT_MODELS and tenant-guarded', (_name, model) => {
    expect(tenantModels.has(model)).toBe(true);
    expect(isTenantGuarded(model.schema)).toBe(true);
  });

  it('every TENANT_MODELS entry is tenant-guarded', () => {
    for (const model of TENANT_MODELS) {
      expect(isTenantGuarded(model.schema), model.modelName).toBe(true);
    }
  });

  it('Business, the tenant root, is not guarded', () => {
    expect(isTenantGuarded(BusinessModel.schema)).toBe(false);
  });
});

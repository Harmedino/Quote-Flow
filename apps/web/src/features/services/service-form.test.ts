import type { ServiceDto } from '@quoteflow/shared';
import { describe, expect, it } from 'vitest';
import { buildServiceInput, toServiceFormValues } from './service-form';

const service: ServiceDto = {
  id: 'service-1',
  name: 'Deep cleaning',
  description: null,
  price: 18_000,
  unit: 'visit',
  active: false,
  createdAt: '2026-09-01T10:00:00.000Z',
  updatedAt: '2026-09-01T10:00:00.000Z',
};

describe('toServiceFormValues', () => {
  it('starts a new service active with no price', () => {
    expect(toServiceFormValues()).toEqual({
      name: '',
      description: '',
      unit: '',
      price: '',
      active: 'true',
    });
  });

  it('prefers the service being edited over defaults', () => {
    expect(toServiceFormValues(service, { name: 'Example', unit: 'room' })).toEqual({
      name: 'Deep cleaning',
      description: '',
      unit: 'visit',
      price: '18000',
      active: 'false',
    });
  });

  it('pre-fills a new service from defaults', () => {
    expect(toServiceFormValues(undefined, { name: 'AC installation', unit: 'unit' })).toMatchObject(
      { name: 'AC installation', unit: 'unit', price: '' },
    );
  });
});

describe('buildServiceInput', () => {
  it('parses price and active state', () => {
    expect(buildServiceInput({ ...toServiceFormValues(service), name: ' Deep clean ' })).toEqual({
      success: true,
      data: { name: 'Deep clean', description: '', unit: 'visit', price: 18_000, active: false },
    });
  });

  it('requires a price, alongside the schema’s other errors', () => {
    expect(buildServiceInput(toServiceFormValues())).toEqual({
      success: false,
      fieldErrors: { name: 'Service name is required', price: 'Enter a price' },
    });
  });

  it('accepts a free service', () => {
    const result = buildServiceInput({ ...toServiceFormValues(), name: 'Site visit', price: '0' });
    expect(result.success && result.data.price).toBe(0);
  });
});

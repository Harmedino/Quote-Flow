import { Types } from 'mongoose';
import { describe, expect, it } from 'vitest';
import { validationErrorsOf } from '../test/model-fixtures';
import { CustomerModel } from './customer.model';
import { toCustomerSnapshot } from './schemas/customer-snapshot';

const businessId = new Types.ObjectId();

describe('CustomerModel', () => {
  it('accepts a customer with contact details and trims the address', async () => {
    const customer = new CustomerModel({
      businessId,
      name: 'Hannah Moore',
      company: 'Greenleaf Café',
      email: 'Hannah@Greenleaf.example',
      phone: '+1 (512) 555-0108',
      address: { line1: ' 1100 E 6th St ', city: 'Austin', country: 'United States' },
    });
    expect(await validationErrorsOf(customer)).toEqual({});
    expect(customer.email).toBe('hannah@greenleaf.example');
    expect(customer.address?.line1).toBe('1100 E 6th St');
    expect(customer.archivedAt).toBeNull();
  });

  it.each([
    ['name', { name: ' ' }],
    ['email', { email: 'hannah@' }],
    ['phone', { phone: '12' }],
    ['company', { company: 'x'.repeat(201) }],
    ['notes', { notes: 'x'.repeat(5001) }],
    ['address.line1', { address: { line1: 'x'.repeat(201) } }],
  ])('rejects an invalid %s', async (path, overrides) => {
    const customer = new CustomerModel({ businessId, name: 'Hannah Moore', ...overrides });
    expect(await validationErrorsOf(customer)).toHaveProperty([path]);
  });

  it('declares indexes for tenant-scoped listing and search', () => {
    expect(CustomerModel.schema.indexes().map(([fields]) => fields)).toEqual(
      expect.arrayContaining([
        { businessId: 1, name: 1 },
        { businessId: 1, createdAt: -1 },
        { businessId: 1, email: 1 },
      ]),
    );
  });
});

describe('toCustomerSnapshot', () => {
  it('copies only the billed-to details', () => {
    const customer = new CustomerModel({
      businessId,
      name: 'Hannah Moore',
      company: 'Greenleaf Café',
      notes: 'Internal note',
    });
    const snapshot = toCustomerSnapshot(customer);
    expect(snapshot).toMatchObject({ name: 'Hannah Moore', company: 'Greenleaf Café' });
    expect(snapshot).not.toHaveProperty('notes');
    expect(snapshot).not.toHaveProperty('businessId');
  });
});

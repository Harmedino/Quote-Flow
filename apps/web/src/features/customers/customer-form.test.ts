import type { CustomerDto } from '@quoteflow/shared';
import { describe, expect, it } from 'vitest';
import { buildCustomerInput, formatAddressLines, toCustomerFormValues } from './customer-form';

const customer: CustomerDto = {
  id: 'customer-1',
  name: 'Grace Okafor',
  email: 'grace@example.com',
  phone: null,
  company: 'Okafor Dental',
  address: { line1: '4 Palm Ave', city: 'Austin', state: 'TX', postalCode: '78701' },
  notes: null,
  archivedAt: null,
  createdAt: '2026-09-01T10:00:00.000Z',
  updatedAt: '2026-09-01T10:00:00.000Z',
};

describe('toCustomerFormValues', () => {
  it('is blank for a new customer', () => {
    expect(Object.values(toCustomerFormValues()).every((value) => value === '')).toBe(true);
  });

  it('uses the field paths as keys and empty strings for missing values', () => {
    expect(toCustomerFormValues(customer)).toMatchObject({
      name: 'Grace Okafor',
      phone: '',
      notes: '',
      'address.line1': '4 Palm Ave',
      'address.country': '',
    });
  });
});

describe('buildCustomerInput', () => {
  it('builds the whole body, trimmed, keeping emptied fields as empty strings to clear them', () => {
    const values = { ...toCustomerFormValues(customer), name: '  Grace O. ', email: '' };
    const result = buildCustomerInput(values);
    expect(result).toEqual({
      success: true,
      data: {
        name: 'Grace O.',
        company: 'Okafor Dental',
        email: '',
        phone: '',
        notes: '',
        address: {
          line1: '4 Palm Ave',
          line2: '',
          city: 'Austin',
          state: 'TX',
          postalCode: '78701',
          country: '',
        },
      },
    });
  });

  it('reports errors under the input names', () => {
    const values = {
      ...toCustomerFormValues(),
      email: 'nope',
      phone: 'call me',
      'address.postalCode': 'x'.repeat(30),
    };
    const result = buildCustomerInput(values);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(Object.keys(result.fieldErrors).sort()).toEqual([
        'address.postalCode',
        'email',
        'name',
        'phone',
      ]);
    }
  });
});

describe('formatAddressLines', () => {
  it('joins the locality and skips empty parts', () => {
    expect(formatAddressLines(customer.address)).toEqual(['4 Palm Ave', 'Austin, TX 78701']);
    expect(formatAddressLines({ country: 'Nigeria' })).toEqual(['Nigeria']);
    expect(formatAddressLines({ postalCode: '100001', country: 'Nigeria' })).toEqual([
      '100001',
      'Nigeria',
    ]);
    expect(formatAddressLines({})).toEqual([]);
  });
});

import {
  DEFAULT_BRAND_COLOR,
  DEFAULT_CURRENCY,
  DEFAULT_INVOICE_DUE_DAYS,
  DEFAULT_INVOICE_PREFIX,
  DEFAULT_QUOTE_PREFIX,
  DEFAULT_QUOTE_VALIDITY_DAYS,
  DEFAULT_TIMEZONE,
} from '@quoteflow/shared';
import { describe, expect, it } from 'vitest';
import { validationErrorsOf } from '../test/model-fixtures';
import { BusinessModel } from './business.model';

describe('BusinessModel', () => {
  it('applies the shared defaults to a new business', async () => {
    const business = new BusinessModel({ name: 'Evergreen Home Services' });
    expect(await validationErrorsOf(business)).toEqual({});
    expect(business).toMatchObject({
      currency: DEFAULT_CURRENCY,
      timezone: DEFAULT_TIMEZONE,
      brandColor: DEFAULT_BRAND_COLOR,
      quotePrefix: DEFAULT_QUOTE_PREFIX,
      invoicePrefix: DEFAULT_INVOICE_PREFIX,
      quoteValidityDays: DEFAULT_QUOTE_VALIDITY_DAYS,
      invoiceDueDays: DEFAULT_INVOICE_DUE_DAYS,
      defaultTaxRate: 0,
    });
  });

  it('normalises settings the way the shared validators do', async () => {
    const business = new BusinessModel({
      name: '  Evergreen  ',
      email: ' Hello@Evergreen.TEST ',
      brandColor: '#15803D',
      quotePrefix: ' ehs-q ',
    });
    expect(await validationErrorsOf(business)).toEqual({});
    expect(business).toMatchObject({
      name: 'Evergreen',
      email: 'hello@evergreen.test',
      brandColor: '#15803d',
      quotePrefix: 'EHS-Q',
    });
  });

  it.each([
    ['name', { name: '' }],
    ['name', { name: 'x'.repeat(121) }],
    ['email', { email: 'not-an-email' }],
    ['phone', { phone: 'call me' }],
    ['website', { website: 'ftp://evergreen.test' }],
    ['logoUrl', { logoUrl: 'not a url' }],
    ['currency', { currency: 'XYZ' }],
    ['timezone', { timezone: 'Mars/Olympus_Mons' }],
    ['brandColor', { brandColor: 'teal' }],
    ['quotePrefix', { quotePrefix: 'QT--' }],
    ['invoicePrefix', { invoicePrefix: 'INVOICE-PREFIX-TOO-LONG' }],
    ['quoteValidityDays', { quoteValidityDays: 0 }],
    ['quoteValidityDays', { quoteValidityDays: 366 }],
    ['quoteValidityDays', { quoteValidityDays: 7.5 }],
    ['invoiceDueDays', { invoiceDueDays: -1 }],
    ['defaultTaxRate', { defaultTaxRate: 7.125 }],
    ['defaultTaxRate', { defaultTaxRate: 101 }],
    ['defaultQuoteTerms', { defaultQuoteTerms: 'x'.repeat(5001) }],
    ['address.postalCode', { address: { postalCode: 'x'.repeat(21) } }],
  ])('rejects an invalid %s', async (path, overrides) => {
    const business = new BusinessModel({ name: 'Evergreen', ...overrides });
    expect(await validationErrorsOf(business)).toHaveProperty([path]);
  });

  it('accepts due-on-receipt invoices (0 days)', async () => {
    const business = new BusinessModel({ name: 'Evergreen', invoiceDueDays: 0 });
    expect(await validationErrorsOf(business)).toEqual({});
  });
});

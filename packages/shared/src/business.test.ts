import { describe, expect, it } from 'vitest';
import { updateBusinessInputSchema } from './business';
import { websiteSchema } from './validation';

describe('updateBusinessInputSchema', () => {
  it('accepts a partial update and normalises values', () => {
    expect(
      updateBusinessInputSchema.parse({
        name: ' Cool Air Services ',
        brandColor: '#1D4ED8',
        quotePrefix: 'ca-q',
        quoteValidityDays: 30,
        defaultTaxRate: 7.5,
      }),
    ).toEqual({
      name: 'Cool Air Services',
      brandColor: '#1d4ed8',
      quotePrefix: 'CA-Q',
      quoteValidityDays: 30,
      defaultTaxRate: 7.5,
    });
  });

  it('allows optional contact fields to be cleared with an empty string', () => {
    expect(updateBusinessInputSchema.parse({ email: '', phone: '', website: '' })).toEqual({
      email: '',
      phone: '',
      website: '',
    });
  });

  it('rejects invalid settings', () => {
    const result = updateBusinessInputSchema.safeParse({
      name: '',
      currency: 'ABC',
      timezone: 'Nowhere/Land',
      quoteValidityDays: 0,
      invoiceDueDays: 1.5,
      defaultTaxRate: 101,
      email: 'not-an-email',
    });
    expect(result.success).toBe(false);
    const paths = result.error?.issues.map((issue) => issue.path.join('.'));
    expect(paths).toEqual(
      expect.arrayContaining([
        'name',
        'currency',
        'timezone',
        'quoteValidityDays',
        'invoiceDueDays',
        'defaultTaxRate',
        'email',
      ]),
    );
  });

  it('does not accept fields that are not settings', () => {
    expect(updateBusinessInputSchema.parse({ logoUrl: 'https://x.test/a.png', id: 'x' })).toEqual(
      {},
    );
  });
});

describe('websiteSchema', () => {
  it('assumes https when the scheme is missing', () => {
    expect(websiteSchema.parse(' www.cool-air.example ')).toBe('https://www.cool-air.example');
    expect(websiteSchema.parse('http://cool-air.example/about')).toBe(
      'http://cool-air.example/about',
    );
  });

  it('rejects values that are not web addresses', () => {
    for (const value of ['not a url', 'https://localhost', 'ftp://files.example', 'https://.com']) {
      expect(websiteSchema.safeParse(value).success).toBe(false);
    }
  });

  it('is not vulnerable to catastrophic backtracking', () => {
    const started = Date.now();
    websiteSchema.safeParse(`https://${'a.'.repeat(1000)}!`);
    websiteSchema.safeParse(`https://a.${'a-'.repeat(1000)}!`);
    expect(Date.now() - started).toBeLessThan(100);
  });
});

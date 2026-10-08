import { describe, expect, it } from 'vitest';
import { testBusiness } from '@/test/fixtures';
import {
  type BusinessFormValues,
  buildBusinessUpdate,
  changedBusinessFields,
  pickerColor,
  previewDocumentNumber,
  rebaseBusinessFormValues,
  toBusinessFormValues,
} from './business-form';

const saved = toBusinessFormValues(testBusiness);

function edit(changes: Partial<BusinessFormValues>): BusinessFormValues {
  return { ...saved, ...changes };
}

describe('toBusinessFormValues', () => {
  it('turns nulls into empty strings and numbers into text', () => {
    expect(saved).toMatchObject({
      name: 'Sparkle Cleaning Co.',
      email: '',
      website: '',
      'address.line1': '12 Admiralty Way',
      'address.line2': '',
      'address.city': 'Lekki',
      quoteValidityDays: '14',
      invoiceDueDays: '0',
      defaultTaxRate: '7.5',
      defaultQuoteNotes: '',
      defaultQuoteTerms: 'Deposit required.',
    });
  });
});

describe('changedBusinessFields', () => {
  it('lists only fields that differ from the saved values', () => {
    expect(changedBusinessFields(saved, saved)).toEqual([]);
    expect(changedBusinessFields(edit({ name: 'New', 'address.city': 'Ikeja' }), saved)).toEqual([
      'name',
      'address.city',
    ]);
  });
});

describe('buildBusinessUpdate', () => {
  it('sends only the changed fields, normalised by the shared schema', () => {
    const result = buildBusinessUpdate(
      edit({ name: ' Sparkle & Shine ', website: 'sparkle.example', quotePrefix: 'sp-q' }),
      saved,
    );

    expect(result).toEqual({
      success: true,
      data: { name: 'Sparkle & Shine', website: 'https://sparkle.example', quotePrefix: 'SP-Q' },
    });
  });

  it('sends an empty string to clear an optional field', () => {
    expect(buildBusinessUpdate(edit({ phone: '', defaultQuoteTerms: '' }), saved)).toEqual({
      success: true,
      data: { phone: '', defaultQuoteTerms: '' },
    });
  });

  it('sends the whole address when any part of it changed', () => {
    expect(buildBusinessUpdate(edit({ 'address.city': 'Ikeja' }), saved)).toEqual({
      success: true,
      data: {
        address: {
          line1: '12 Admiralty Way',
          line2: '',
          city: 'Ikeja',
          state: '',
          postalCode: '',
          country: '',
        },
      },
    });
  });

  it('parses numeric fields', () => {
    expect(
      buildBusinessUpdate(
        edit({ quoteValidityDays: ' 30 ', invoiceDueDays: '7', defaultTaxRate: '12.5' }),
        saved,
      ),
    ).toEqual({
      success: true,
      data: { quoteValidityDays: 30, invoiceDueDays: 7, defaultTaxRate: 12.5 },
    });
  });

  it('explains blank or non-numeric numbers before the shared rules apply', () => {
    expect(
      buildBusinessUpdate(
        edit({ quoteValidityDays: '', invoiceDueDays: 'abc', defaultTaxRate: '7,5' }),
        saved,
      ),
    ).toEqual({
      success: false,
      fieldErrors: {
        quoteValidityDays: 'Enter a number of days',
        invoiceDueDays: 'Enter a number',
        defaultTaxRate: 'Enter a number such as 7.5',
      },
    });
  });

  it('applies the shared range rules to parsed numbers', () => {
    expect(buildBusinessUpdate(edit({ defaultTaxRate: '101' }), saved)).toEqual({
      success: false,
      fieldErrors: { defaultTaxRate: 'Percentage cannot exceed 100' },
    });
  });

  it('reports the shared validation rules for every changed field', () => {
    expect(
      buildBusinessUpdate(
        edit({
          name: ' ',
          email: 'not-an-email',
          quotePrefix: 'Q T',
          quoteValidityDays: '0',
          invoiceDueDays: '1.5',
          brandColor: '#12345',
          defaultTaxRate: '',
        }),
        saved,
      ),
    ).toEqual({
      success: false,
      fieldErrors: {
        name: 'Business name is required',
        email: 'Enter a valid email address',
        quotePrefix: 'Use letters and numbers, optionally separated by single hyphens',
        quoteValidityDays: 'Must be at least 1 days',
        invoiceDueDays: 'Enter a whole number of days',
        brandColor: 'Enter a hex color such as #0f766e',
        defaultTaxRate: 'Enter a tax rate (0 if you don’t charge tax)',
      },
    });
  });
});

describe('rebaseBusinessFormValues', () => {
  it('takes the saved values except for fields edited during the save', () => {
    const submitted = edit({ website: 'sparkle.example', name: 'Shine' });
    const current = { ...submitted, name: 'Shine & Co' };
    const fromServer = edit({ website: 'https://sparkle.example', name: 'Shine' });

    expect(rebaseBusinessFormValues(current, submitted, fromServer)).toEqual({
      ...fromServer,
      name: 'Shine & Co',
    });
  });
});

describe('previewDocumentNumber', () => {
  it('formats the first number for a valid prefix', () => {
    expect(previewDocumentNumber('QT')).toBe('QT-0001');
    expect(previewDocumentNumber(' ehs-inv ')).toBe('EHS-INV-0001');
  });

  it('returns null while the prefix is invalid', () => {
    expect(previewDocumentNumber('')).toBeNull();
    expect(previewDocumentNumber('Q T')).toBeNull();
    expect(previewDocumentNumber('QT-')).toBeNull();
  });
});

describe('pickerColor', () => {
  it('uses a complete hex color and falls back otherwise', () => {
    expect(pickerColor('#1D4ED8', '#0f766e')).toBe('#1d4ed8');
    expect(pickerColor('#1D4', '#0f766e')).toBe('#0f766e');
    expect(pickerColor('teal', '#0f766e')).toBe('#0f766e');
  });
});

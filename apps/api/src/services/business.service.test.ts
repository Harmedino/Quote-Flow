import { updateBusinessInputSchema } from '@quoteflow/shared';
import { describe, expect, it } from 'vitest';
import { BusinessModel } from '../models';
import { toBusinessChanges } from './business.service';

const changesFor = (input: unknown) => toBusinessChanges(updateBusinessInputSchema.parse(input));

describe('toBusinessChanges', () => {
  it('changes only the fields that were sent', () => {
    expect(changesFor({})).toEqual([]);
    expect(changesFor({ name: '  Sparkle  ', quoteValidityDays: 30 })).toEqual([
      ['name', 'Sparkle'],
      ['quoteValidityDays', 30],
    ]);
  });

  it("turns '' into a removal of each optional text field", () => {
    expect(
      changesFor({
        email: '',
        phone: '',
        website: '',
        defaultQuoteNotes: '   ',
        defaultQuoteTerms: '',
        defaultInvoiceNotes: '',
        defaultInvoiceTerms: '',
      }),
    ).toEqual([
      ['email', undefined],
      ['phone', undefined],
      ['website', undefined],
      ['defaultQuoteNotes', undefined],
      ['defaultQuoteTerms', undefined],
      ['defaultInvoiceNotes', undefined],
      ['defaultInvoiceTerms', undefined],
    ]);
  });

  it('applies the address part by part, keeping the parts that were not sent', () => {
    expect(
      changesFor({ address: { line1: ' 12 Marina Rd ', city: '', country: 'Nigeria' } }),
    ).toEqual([
      ['address.line1', '12 Marina Rd'],
      ['address.city', undefined],
      ['address.country', 'Nigeria'],
    ]);
  });

  it('keeps the values the shared schema normalised', () => {
    expect(
      changesFor({
        email: 'Hello@Sparkle.Example',
        website: 'sparkle.example',
        quotePrefix: 'sc-q',
      }),
    ).toEqual([
      ['email', 'hello@sparkle.example'],
      ['website', 'https://sparkle.example'],
      ['quotePrefix', 'SC-Q'],
    ]);
  });

  it('removes cleared fields from the stored document', () => {
    const business = new BusinessModel({
      name: 'Sparkle',
      email: 'hello@sparkle.example',
      address: { line1: '12 Marina Rd', city: 'Lagos' },
    });

    for (const [path, value] of changesFor({ email: '', address: { city: '' } })) {
      business.set(path, value);
    }

    const stored = business.toObject();
    expect(stored).not.toHaveProperty('email');
    expect(stored.address).toEqual({ line1: '12 Marina Rd' });
  });
});

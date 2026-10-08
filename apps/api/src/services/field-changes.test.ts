import { describe, expect, it } from 'vitest';
import { toFieldChanges, withoutBlankFields } from './field-changes';

describe('toFieldChanges', () => {
  it('skips omitted fields, clears empty strings and flattens nested objects', () => {
    expect(
      toFieldChanges({
        name: 'Grace',
        email: '',
        phone: undefined,
        active: false,
        price: 0,
        address: { city: 'Austin', line2: '', state: undefined },
      }),
    ).toEqual([
      ['name', 'Grace'],
      ['email', undefined],
      ['active', false],
      ['price', 0],
      ['address.city', 'Austin'],
      ['address.line2', undefined],
    ]);
  });
});

describe('withoutBlankFields', () => {
  it('drops empty strings and undefined but keeps falsy values that mean something', () => {
    expect(withoutBlankFields({ a: '', b: undefined, c: 0, d: false, e: 'x' })).toEqual({
      c: 0,
      d: false,
      e: 'x',
    });
  });
});

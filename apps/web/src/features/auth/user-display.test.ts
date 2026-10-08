import { describe, expect, it } from 'vitest';
import { firstName, initials } from './user-display';

describe('firstName', () => {
  it('returns the first word of the name', () => {
    expect(firstName('  Amina   Bello Yusuf ')).toBe('Amina');
    expect(firstName('Cher')).toBe('Cher');
    expect(firstName('   ')).toBe('');
  });
});

describe('initials', () => {
  it('uses the first and last words', () => {
    expect(initials('Amina Bello Yusuf')).toBe('AY');
    expect(initials('tunde bakare')).toBe('TB');
    expect(initials('Cher')).toBe('C');
    expect(initials('')).toBe('');
  });

  it('keeps characters outside the basic plane intact', () => {
    expect(initials('𝒜da Lovelace')).toBe('𝒜L');
    expect(initials('Élodie Ñúñez')).toBe('ÉÑ');
  });
});

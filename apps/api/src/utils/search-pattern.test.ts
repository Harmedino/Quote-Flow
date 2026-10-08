import { describe, expect, it } from 'vitest';
import { containsPattern, escapeRegex, phoneDigitsPattern } from './search-pattern';

describe('escapeRegex / containsPattern', () => {
  it('escapes every metacharacter so input only matches literally', () => {
    const special = '.*+?^${}()|[]\\/-';
    expect(new RegExp(`^${escapeRegex(special)}$`).test(special)).toBe(true);
    expect(containsPattern('a.*(').test('abc(')).toBe(false);
    expect(containsPattern('a.*(').test('xa.*(y')).toBe(true);
  });

  it('matches case-insensitively', () => {
    expect(containsPattern('ACME').test('acme ltd')).toBe(true);
  });
});

describe('phoneDigitsPattern', () => {
  it('finds a number regardless of its formatting', () => {
    const pattern = phoneDigitsPattern('5550101');
    expect(pattern?.test('+1 (555) 010-1')).toBe(true);
    expect(pattern?.test('+1 555 0102')).toBe(false);
  });

  it('is null for text and for fewer than three digits', () => {
    expect(phoneDigitsPattern('Alice')).toBeNull();
    expect(phoneDigitsPattern('12')).toBeNull();
    expect(phoneDigitsPattern('a1234')).toBeNull();
  });
});

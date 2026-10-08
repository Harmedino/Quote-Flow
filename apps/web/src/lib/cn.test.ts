import { describe, expect, it } from 'vitest';
import { cn } from './cn';

describe('cn', () => {
  it('joins class names with single spaces', () => {
    expect(cn('px-4', 'py-2', 'text-sm')).toBe('px-4 py-2 text-sm');
  });

  it('skips falsy values', () => {
    const isActive = false;
    expect(cn('base', isActive && 'active', null, undefined, '', 'end')).toBe('base end');
  });

  it('returns an empty string when nothing is truthy', () => {
    expect(cn(false, null, undefined)).toBe('');
  });
});

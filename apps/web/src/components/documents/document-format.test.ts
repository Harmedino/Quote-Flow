import { describe, expect, it } from 'vitest';
import { DEFAULT_BRAND_COLOR } from '@quoteflow/shared';
import { brandColorVars, brandTextColor, contrastRatio, textColorOn } from './brand-color';
import {
  businessInitials,
  discountLabel,
  formatAddressLines,
  formatPercent,
  formatQuantity,
  safeHttpUrl,
  telHref,
  websiteLabel,
} from './document-format';

describe('document formatting', () => {
  it('formats quantities with up to three decimals', () => {
    expect(formatQuantity(2, 'en-US')).toBe('2');
    expect(formatQuantity(2.5, 'en-US')).toBe('2.5');
    expect(formatQuantity(12.125, 'en-US')).toBe('12.125');
    expect(formatQuantity(1500, 'en-US')).toBe('1,500');
  });

  it('formats rates as percentages', () => {
    expect(formatPercent(7.5, 'en-US')).toBe('7.5%');
    expect(formatPercent(10, 'en-US')).toBe('10%');
  });

  it('labels percentage discounts with their rate and fixed ones plainly', () => {
    expect(discountLabel({ type: 'percentage', value: 12.5 }, 'en-US')).toBe('Discount (12.5%)');
    expect(discountLabel({ type: 'fixed', value: 5_000 })).toBe('Discount');
    expect(discountLabel(null)).toBe('Discount');
  });

  it('turns an address into display lines, skipping empty parts', () => {
    expect(
      formatAddressLines({
        line1: '12 Admiralty Way',
        city: 'Lekki',
        state: 'Lagos',
        postalCode: '106104',
        country: 'Nigeria',
      }),
    ).toEqual(['12 Admiralty Way', 'Lekki, Lagos 106104', 'Nigeria']);
    expect(formatAddressLines({ postalCode: '10115' })).toEqual(['10115']);
    expect(formatAddressLines({})).toEqual([]);
    expect(formatAddressLines(undefined)).toEqual([]);
  });

  it('derives at most two initials', () => {
    expect(businessInitials('Sparkle Cleaning Co.')).toBe('SC');
    expect(businessInitials('acme')).toBe('A');
    expect(businessInitials('  Ünal & Söhne  ')).toBe('ÜS');
    expect(businessInitials('!!!')).toBe('!');
  });

  it('shortens websites and only links http(s) URLs', () => {
    expect(websiteLabel('https://sparkle.example/')).toBe('sparkle.example');
    expect(safeHttpUrl('https://sparkle.example')).toBe('https://sparkle.example/');
    expect(safeHttpUrl('javascript:alert(1)')).toBeNull();
    expect(safeHttpUrl('not a url')).toBeNull();
    expect(safeHttpUrl(null)).toBeNull();
  });

  it('dials a phone number as typed, keeping only digits and the plus', () => {
    expect(telHref('+234 801 234 5678')).toBe('tel:+2348012345678');
    expect(telHref('(512) 555-0142')).toBe('tel:5125550142');
  });
});

describe('brand colors', () => {
  it('keeps a dark brand color for text and darkens a light one until it is readable', () => {
    expect(brandTextColor('#0f766e')).toBe('#0f766e');
    const yellow = brandTextColor('#facc15');
    expect(yellow).not.toBe('#facc15');
    expect(contrastRatio(yellow, '#ffffff')).toBeGreaterThanOrEqual(4.5);
  });

  it('picks white or ink for text on a brand fill', () => {
    expect(textColorOn('#0f766e')).toBe('#ffffff');
    expect(textColorOn('#facc15')).toBe('#18181b');
  });

  it('falls back to the default brand color for invalid input', () => {
    expect(brandColorVars('red')).toMatchObject({ '--doc-accent': DEFAULT_BRAND_COLOR });
    expect(brandColorVars(null)).toMatchObject({ '--doc-accent': DEFAULT_BRAND_COLOR });
    expect(brandColorVars('#1D4ED8')).toMatchObject({ '--doc-accent': '#1d4ed8' });
  });
});

import { CURRENCIES, DEFAULT_TIMEZONE } from '@quoteflow/shared';
import { describe, expect, it, vi } from 'vitest';
import {
  CURRENCY_OPTIONS,
  guessCurrency,
  listTimeZones,
  timeZoneLabel,
  timeZoneOptions,
} from './locale';

describe('guessCurrency', () => {
  it.each([
    ['en-US', 'USD'],
    ['en-NG', 'NGN'],
    ['en-GB', 'GBP'],
    ['fr-FR', 'EUR'],
    ['de-AT', 'EUR'],
    ['bg-BG', 'EUR'],
    ['fr-SN', 'XOF'],
    ['fr-CM', 'XAF'],
    ['ar-AE', 'AED'],
    ['en-IN', 'INR'],
    ['pt-BR', 'BRL'],
    ['es-MX', 'MXN'],
    ['sw-KE', 'KES'],
    ['en-gh', 'GHS'],
    ['zh-Hans-CN', 'CNY'],
  ])('maps %s to %s', (locale, currency) => {
    expect(guessCurrency(locale)).toBe(currency);
  });

  it.each([
    ['a language without a region', 'en'],
    ['a region without a supported currency', 'is-IS'],
    ['a UN M.49 area code', 'es-419'],
    ['an invalid tag', 'not a locale!'],
    ['no locale', undefined],
  ])('falls back to USD for %s', (_case, locale) => {
    expect(guessCurrency(locale)).toBe('USD');
  });
});

describe('CURRENCY_OPTIONS', () => {
  it('labels every supported currency with its name and code', () => {
    expect(CURRENCY_OPTIONS).toHaveLength(CURRENCIES.length);
    expect(CURRENCY_OPTIONS[0]).toEqual({ value: 'USD', label: 'US Dollar (USD)' });
    expect(CURRENCY_OPTIONS).toContainEqual({ value: 'NGN', label: 'Nigerian Naira (NGN)' });
  });
});

describe('time zones', () => {
  it('lists the browser zones plus UTC and any saved zone, sorted', () => {
    const zones = listTimeZones(['Etc/GMT+5', null]);

    expect(zones).toContain('Africa/Lagos');
    expect(zones).toContain(DEFAULT_TIMEZONE);
    expect(zones).toContain('Etc/GMT+5');
    expect(zones).toEqual([...zones].sort((a, b) => a.localeCompare(b, 'en')));
    expect(new Set(zones).size).toBe(zones.length);
  });

  it('still offers UTC and the saved zone without Intl.supportedValuesOf', () => {
    const original = Object.getOwnPropertyDescriptor(Intl, 'supportedValuesOf');
    Object.defineProperty(Intl, 'supportedValuesOf', { value: undefined, configurable: true });
    try {
      expect(listTimeZones(['Africa/Lagos'])).toEqual(['Africa/Lagos', 'UTC']);
    } finally {
      if (original) {
        Object.defineProperty(Intl, 'supportedValuesOf', original);
      }
    }
  });

  it('labels zones with their UTC offset at the given time', () => {
    const winter = new Date('2026-01-15T12:00:00Z');
    const summer = new Date('2026-07-15T12:00:00Z');

    expect(timeZoneLabel('Africa/Lagos', winter)).toBe('Africa/Lagos (GMT+1)');
    expect(timeZoneLabel('America/New_York', winter)).toBe('America/New York (GMT-5)');
    expect(timeZoneLabel('America/New_York', summer)).toBe('America/New York (GMT-4)');
    expect(timeZoneOptions(['UTC'], winter)).toContainEqual({ value: 'UTC', label: 'UTC (GMT)' });
  });

  it('keeps the GMT style when the runtime names the zero offset "UTC"', () => {
    const formatToParts = vi
      .spyOn(Intl.DateTimeFormat.prototype, 'formatToParts')
      .mockReturnValue([{ type: 'timeZoneName', value: 'UTC' }]);
    try {
      expect(timeZoneLabel('UTC', new Date('2026-01-15T12:00:00Z'))).toBe('UTC (GMT)');
    } finally {
      formatToParts.mockRestore();
    }
  });

  it('labels an unknown zone with its name only', () => {
    expect(timeZoneLabel('Mars/Olympus_Mons', new Date())).toBe('Mars/Olympus Mons');
  });
});

import { describe, expect, it } from 'vitest';
import {
  addDaysToIsoDate,
  isValidIsoDate,
  isoDateToUtcDate,
  todayInTimeZone,
  utcDateToIsoDate,
} from './dates';
import {
  canCancelInvoice,
  canConvertQuote,
  canRecordPayment,
  getEffectiveInvoiceStatus,
  getEffectiveQuoteStatus,
} from './rules';
import { buildQuoteShareMessage, buildWhatsAppUrl, toWhatsAppPhone } from './sharing';

describe('dates', () => {
  it('validates calendar dates', () => {
    expect(isValidIsoDate('2026-02-28')).toBe(true);
    expect(isValidIsoDate('2026-02-30')).toBe(false);
    expect(isValidIsoDate('2026-2-3')).toBe(false);
  });

  it('round-trips through UTC midnight and adds days across month ends', () => {
    expect(utcDateToIsoDate(isoDateToUtcDate('2026-12-31'))).toBe('2026-12-31');
    expect(addDaysToIsoDate('2026-12-25', 14)).toBe('2027-01-08');
  });

  it('evaluates today in the business time zone', () => {
    const instant = new Date('2026-10-08T23:30:00Z');
    expect(todayInTimeZone('UTC', instant)).toBe('2026-10-08');
    expect(todayInTimeZone('Africa/Lagos', instant)).toBe('2026-10-09');
    expect(todayInTimeZone('America/Chicago', instant)).toBe('2026-10-08');
  });
});

describe('rules', () => {
  it('reports live quotes past their expiry date as expired', () => {
    expect(getEffectiveQuoteStatus('sent', '2026-10-01', '2026-10-02')).toBe('expired');
    expect(getEffectiveQuoteStatus('viewed', '2026-10-02', '2026-10-02')).toBe('viewed');
    expect(getEffectiveQuoteStatus('accepted', '2026-10-01', '2026-10-09')).toBe('accepted');
    expect(getEffectiveQuoteStatus('draft', '2026-10-01', '2026-10-09')).toBe('draft');
  });

  it('reports unpaid invoices past their due date as overdue', () => {
    expect(getEffectiveInvoiceStatus('sent', '2026-10-01', 500, '2026-10-02')).toBe('overdue');
    expect(getEffectiveInvoiceStatus('partially_paid', '2026-10-01', 1, '2026-10-02')).toBe(
      'overdue',
    );
    expect(getEffectiveInvoiceStatus('sent', '2026-10-01', 0, '2026-10-02')).toBe('sent');
    expect(getEffectiveInvoiceStatus('draft', '2026-10-01', 500, '2026-10-02')).toBe('draft');
  });

  it('allows conversion of accepted, unconverted quotes only', () => {
    expect(canConvertQuote('accepted', null)).toBe(true);
    expect(canConvertQuote('accepted', 'abc')).toBe(false);
    expect(canConvertQuote('viewed', null)).toBe(false);
  });

  it('guards payments and cancellation', () => {
    expect(canRecordPayment('sent', 100)).toBe(true);
    expect(canRecordPayment('draft', 100)).toBe(false);
    expect(canRecordPayment('paid', 0)).toBe(false);
    expect(canCancelInvoice('sent', 0)).toBe(true);
    expect(canCancelInvoice('partially_paid', 100)).toBe(false);
  });
});

describe('sharing', () => {
  it('normalises international phone numbers for wa.me', () => {
    expect(toWhatsAppPhone('+234 803 123 4567')).toBe('2348031234567');
    expect(toWhatsAppPhone('00971 50 123 4567')).toBe('971501234567');
    expect(toWhatsAppPhone('12345')).toBeNull();
    expect(toWhatsAppPhone(null)).toBeNull();
  });

  it('rejects local numbers that start with a trunk prefix', () => {
    expect(toWhatsAppPhone('0803 765 4321')).toBeNull();
    expect(toWhatsAppPhone('(0)20 7946 0958')).toBeNull();
    expect(buildWhatsAppUrl('Hi', '08037654321')).toBe('https://wa.me/?text=Hi');
  });

  it('builds the share message and link', () => {
    const message = buildQuoteShareMessage({
      customerName: 'John Smith',
      businessName: 'Ahmed Cleaning Services',
      quoteNumber: 'QT-0042',
      url: 'https://app.example.com/quote/abc',
    });
    expect(message).toBe(
      'Hi John,\n\nHere is your quotation QT-0042 from Ahmed Cleaning Services.\n\nView your quotation:\nhttps://app.example.com/quote/abc\n\nThank you.',
    );
    expect(buildWhatsAppUrl('Hi there', '+1 512 555 0142')).toBe(
      'https://wa.me/15125550142?text=Hi%20there',
    );
    expect(buildWhatsAppUrl('Hi')).toBe('https://wa.me/?text=Hi');
  });
});

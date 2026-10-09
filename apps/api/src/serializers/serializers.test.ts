import {
  type BusinessDto,
  DEFAULT_BRAND_COLOR,
  DEFAULT_CURRENCY,
  DEFAULT_INVOICE_DUE_DAYS,
  DEFAULT_INVOICE_PREFIX,
  DEFAULT_QUOTE_PREFIX,
  DEFAULT_QUOTE_VALIDITY_DAYS,
  DEFAULT_TIMEZONE,
  type UserDto,
} from '@quoteflow/shared';
import { Types } from 'mongoose';
import { describe, expect, expectTypeOf, it } from 'vitest';
import { BusinessModel, UserModel } from '../models';
import { DEMO_BUSINESS } from '../demo/data/business';
import { toBusinessDto } from './business.serializer';
import { toUserDto } from './user.serializer';

const CREATED = new Date('2026-01-15T08:30:00.000Z');
const UPDATED = new Date('2026-02-01T12:00:00.000Z');

describe('toUserDto', () => {
  it('returns exactly the public user fields, never the password hash', () => {
    const user = new UserModel({
      businessId: new Types.ObjectId(),
      name: 'Maya Robinson',
      email: 'maya@example.com',
      passwordHash: '$2b$12$secret-hash-that-must-not-leak',
      role: 'owner',
      lastLoginAt: UPDATED,
      createdAt: CREATED,
    });

    const dto = toUserDto(user);

    expectTypeOf(dto).toEqualTypeOf<UserDto>();
    expect(dto).toEqual({
      id: user._id.toString(),
      name: 'Maya Robinson',
      email: 'maya@example.com',
      role: 'owner',
      createdAt: '2026-01-15T08:30:00.000Z',
    });
    expect(JSON.stringify(dto)).not.toContain('secret-hash');
  });
});

describe('toBusinessDto', () => {
  it('maps every field, with ISO dates and null for unset optional values', () => {
    const business = new BusinessModel({ name: 'Sparkle Cleaning Co.', createdAt: CREATED });
    business.updatedAt = UPDATED;

    const dto = toBusinessDto(business);

    expectTypeOf(dto).toEqualTypeOf<BusinessDto>();
    expect(dto).toEqual({
      id: business._id.toString(),
      name: 'Sparkle Cleaning Co.',
      email: null,
      phone: null,
      website: null,
      logoUrl: null,
      address: {},
      currency: DEFAULT_CURRENCY,
      timezone: DEFAULT_TIMEZONE,
      brandColor: DEFAULT_BRAND_COLOR,
      quotePrefix: DEFAULT_QUOTE_PREFIX,
      invoicePrefix: DEFAULT_INVOICE_PREFIX,
      quoteValidityDays: DEFAULT_QUOTE_VALIDITY_DAYS,
      invoiceDueDays: DEFAULT_INVOICE_DUE_DAYS,
      defaultTaxRate: 0,
      defaultQuoteNotes: null,
      defaultQuoteTerms: null,
      defaultInvoiceNotes: null,
      defaultInvoiceTerms: null,
      createdAt: '2026-01-15T08:30:00.000Z',
      updatedAt: '2026-02-01T12:00:00.000Z',
    });
  });

  it('includes every set field and only the set parts of the address', () => {
    const business = new BusinessModel({
      ...DEMO_BUSINESS,
      logoUrl: 'https://cdn.example.com/logo.png',
      address: { city: 'Austin', country: 'United States' },
      createdAt: CREATED,
      updatedAt: UPDATED,
    });

    const dto = toBusinessDto(business);

    expect(dto).toMatchObject({
      email: DEMO_BUSINESS.email,
      phone: DEMO_BUSINESS.phone,
      website: DEMO_BUSINESS.website,
      logoUrl: 'https://cdn.example.com/logo.png',
      address: { city: 'Austin', country: 'United States' },
      defaultQuoteTerms: DEMO_BUSINESS.defaultQuoteTerms,
      defaultInvoiceNotes: DEMO_BUSINESS.defaultInvoiceNotes,
    });
    expect(Object.keys(dto.address)).toEqual(['city', 'country']);
  });

  it('exposes no internal fields', () => {
    const dto = toBusinessDto(
      new BusinessModel({ name: 'Sparkle', createdAt: CREATED, updatedAt: UPDATED }),
    );

    expect(dto).not.toHaveProperty('_id');
    expect(dto).not.toHaveProperty('__v');
    expect(dto).not.toHaveProperty('businessId');
  });
});

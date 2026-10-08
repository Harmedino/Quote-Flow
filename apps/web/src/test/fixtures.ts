import type { AuthSessionDto, BusinessDto, UserDto } from '@quoteflow/shared';

/** Test data shaped exactly like the API contract, and response builders for fetch mocks. */

export const testUser: UserDto = {
  id: 'user-1',
  name: 'Amina Yusuf',
  email: 'amina@sparkle.example',
  role: 'owner',
  createdAt: '2026-09-01T10:00:00.000Z',
};

export const testBusiness: BusinessDto = {
  id: 'business-1',
  name: 'Sparkle Cleaning Co.',
  email: null,
  phone: '+234 801 234 5678',
  website: null,
  logoUrl: null,
  address: { line1: '12 Admiralty Way', city: 'Lekki' },
  currency: 'NGN',
  timezone: 'Africa/Lagos',
  brandColor: '#0f766e',
  quotePrefix: 'QT',
  invoicePrefix: 'INV',
  quoteValidityDays: 14,
  invoiceDueDays: 0,
  defaultTaxRate: 7.5,
  defaultQuoteNotes: null,
  defaultQuoteTerms: 'Deposit required.',
  defaultInvoiceNotes: null,
  defaultInvoiceTerms: null,
  createdAt: '2026-09-01T10:00:00.000Z',
  updatedAt: '2026-10-01T10:00:00.000Z',
};

export function testSession(accessToken = 'token-1', user: UserDto = testUser): AuthSessionDto {
  return {
    user,
    business: testBusiness,
    accessToken,
    accessTokenExpiresAt: '2026-10-08T12:15:00.000Z',
  };
}

export function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export function errorResponse(status: number, code: string, message = 'Request failed'): Response {
  return jsonResponse({ error: { code, message, requestId: 'req-test' } }, status);
}

export function noContent(): Response {
  return new Response(null, { status: 204 });
}

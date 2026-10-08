import type { PublicInvoiceDto, PublicQuoteDto } from '@quoteflow/shared';
import { describe, expect, it } from 'vitest';
import { buildPublicPdfUrl } from './public-api';
import { businessContactLinks, invoiceStatusBanner, quoteStatusBanner } from './public-status';

const business: PublicQuoteDto['business'] = {
  name: 'Sparkle Cleaning Co.',
  logoUrl: null,
  email: 'hello@sparkle.example',
  phone: '+234 801 234 5678',
  website: null,
  address: {},
  brandColor: '#0f766e',
};

const document = {
  currency: 'USD',
  customer: { name: 'Olivia Harper', email: null, phone: null, company: null, address: {} },
  items: [],
  discount: null,
  taxRate: 0,
  totals: { subtotal: 10_000, discount: 0, tax: 0, total: 10_000 },
  notes: null,
  terms: null,
  issueDate: '2026-10-01',
} as const;

function quoteDto(overrides: Partial<PublicQuoteDto['quote']>): PublicQuoteDto {
  return {
    business,
    quote: {
      ...document,
      items: [],
      quoteNumber: 'QT-0001',
      status: 'viewed',
      expiryDate: '2026-10-15',
      acceptedAt: null,
      rejectedAt: null,
      rejectionReason: null,
      ...overrides,
    },
  };
}

function invoiceDto(overrides: Partial<PublicInvoiceDto['invoice']>): PublicInvoiceDto {
  return {
    business,
    invoice: {
      ...document,
      items: [],
      invoiceNumber: 'INV-0001',
      status: 'sent',
      amountPaid: 0,
      balanceDue: 10_000,
      dueDate: '2026-10-15',
      paidAt: null,
      ...overrides,
    },
  };
}

const en = { locale: 'en-US', timeZone: 'UTC' };

describe('quoteStatusBanner', () => {
  it('shows nothing while the quote is waiting for an answer', () => {
    expect(quoteStatusBanner(quoteDto({ status: 'sent' }), false, en)).toBeNull();
    expect(quoteStatusBanner(quoteDto({ status: 'viewed' }), false, en)).toBeNull();
  });

  it('confirms an acceptance with its date', () => {
    const banner = quoteStatusBanner(
      quoteDto({ status: 'accepted', acceptedAt: '2026-10-08T10:00:00.000Z' }),
      true,
      en,
    );
    expect(banner).toMatchObject({ tone: 'success', title: 'Quote accepted. Thank you!' });
    expect(banner?.message).toBe(
      'You accepted this quote on Oct 8, 2026. Sparkle Cleaning Co. will be in touch to arrange the next steps.',
    );
  });

  it('explains a declined and an expired quote and offers contact details', () => {
    const declined = quoteStatusBanner(
      quoteDto({ status: 'rejected', rejectedAt: '2026-10-08T10:00:00.000Z' }),
      false,
      en,
    );
    expect(declined).toMatchObject({ tone: 'neutral', showContact: true });
    expect(declined?.message).toContain('You declined this quote on Oct 8, 2026.');

    const expired = quoteStatusBanner(quoteDto({ status: 'expired' }), false, en);
    expect(expired).toMatchObject({ tone: 'warning', title: 'This quote has expired' });
    expect(expired?.message).toBe(
      'It was valid until Oct 15, 2026. Please contact Sparkle Cleaning Co. for an updated quote.',
    );
  });
});

describe('invoiceStatusBanner', () => {
  it('shows nothing while payment is simply due', () => {
    expect(invoiceStatusBanner(invoiceDto({ status: 'sent' }), en)).toBeNull();
    expect(invoiceStatusBanner(invoiceDto({ status: 'partially_paid' }), en)).toBeNull();
  });

  it('describes paid, overdue and cancelled invoices', () => {
    expect(
      invoiceStatusBanner(
        invoiceDto({ status: 'paid', balanceDue: 0, paidAt: '2026-10-08T00:00:00.000Z' }),
        en,
      ),
    ).toMatchObject({
      tone: 'success',
      message: 'Thank you! This invoice was paid on Oct 8, 2026.',
    });
    expect(invoiceStatusBanner(invoiceDto({ status: 'overdue' }), en)?.message).toBe(
      'This invoice was due on Oct 15, 2026. $100.00 is outstanding. Please contact Sparkle Cleaning Co. to arrange payment.',
    );
    expect(invoiceStatusBanner(invoiceDto({ status: 'cancelled' }), en)).toMatchObject({
      tone: 'neutral',
      title: 'Invoice cancelled',
    });
  });
});

describe('businessContactLinks', () => {
  it('offers phone, WhatsApp and email links', () => {
    const links = businessContactLinks(business, 'Quote QT-0001');

    expect(links.map((link) => link.kind)).toEqual(['phone', 'whatsapp', 'email']);
    expect(links[0]?.href).toBe('tel:+2348012345678');
    expect(links[1]?.href).toMatch(/^https:\/\/wa\.me\/2348012345678\?text=/);
    expect(links[2]?.href).toBe('mailto:hello@sparkle.example?subject=Quote%20QT-0001');
  });

  it('skips WhatsApp for numbers without a country code and missing details', () => {
    expect(
      businessContactLinks({ ...business, phone: '555 01', email: null }, 'x').map((l) => l.kind),
    ).toEqual(['phone']);
    expect(businessContactLinks({ ...business, phone: null, email: null }, 'x')).toEqual([]);
  });
});

describe('buildPublicPdfUrl', () => {
  it('points at the public PDF endpoint under the API base URL', () => {
    expect(buildPublicPdfUrl('/api', 'quote', 'abc_DEF-123')).toBe(
      '/api/public/quotes/abc_DEF-123/pdf',
    );
    expect(buildPublicPdfUrl('https://api.example.com/api', 'invoice', 'a/b')).toBe(
      'https://api.example.com/api/public/invoices/a%2Fb/pdf',
    );
  });
});

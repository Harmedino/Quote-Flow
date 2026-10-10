import type { InvoiceDto } from '@quoteflow/shared';
import { describe, expect, it } from 'vitest';
import {
  buildInvoiceShareLinks,
  getInvoiceActions,
  invoiceOutlook,
  invoicePublicUrl,
} from './invoice-view';

function invoice(overrides: Partial<InvoiceDto> = {}): InvoiceDto {
  return {
    id: 'inv1',
    invoiceNumber: 'INV-0007',
    status: 'sent',
    currency: 'USD',
    customerId: 'c1',
    customer: {
      name: 'Olivia Harper',
      email: null,
      phone: '+1 (555) 010-1234',
      company: null,
      address: {},
    },
    quoteId: null,
    items: [],
    discount: null,
    taxRate: 0,
    totals: { subtotal: 125_000, discount: 0, tax: 0, total: 125_000 },
    amountPaid: 0,
    balanceDue: 125_000,
    payments: [],
    notes: null,
    terms: null,
    issueDate: '2026-11-01',
    dueDate: '2026-11-15',
    publicToken: 'tok_abc',
    sentAt: null,
    paidAt: null,
    cancelledAt: null,
    createdAt: '2026-11-01T10:00:00.000Z',
    updatedAt: '2026-11-01T10:00:00.000Z',
    ...overrides,
  };
}

describe('getInvoiceActions', () => {
  it('offers editing, deleting and sending for drafts, but not payments', () => {
    expect(getInvoiceActions(invoice({ status: 'draft' }))).toEqual({
      edit: true,
      delete: true,
      markAsSent: true,
      recordPayment: false,
      share: true,
      cancel: true,
    });
  });

  it('offers payments and cancelling for unpaid sent and overdue invoices', () => {
    for (const status of ['sent', 'overdue'] as const) {
      expect(getInvoiceActions(invoice({ status }))).toMatchObject({
        edit: false,
        delete: false,
        markAsSent: false,
        recordPayment: true,
        share: true,
        cancel: true,
      });
    }
  });

  it('blocks cancelling once a payment is recorded', () => {
    const partial = invoice({ status: 'partially_paid', amountPaid: 1_000, balanceDue: 124_000 });
    expect(getInvoiceActions(partial)).toMatchObject({ recordPayment: true, cancel: false });
  });

  it('offers nothing but viewing for paid and cancelled invoices', () => {
    for (const status of ['paid', 'cancelled'] as const) {
      expect(getInvoiceActions(invoice({ status, balanceDue: 0 }))).toEqual({
        edit: false,
        delete: false,
        markAsSent: false,
        recordPayment: false,
        share: false,
        cancel: false,
      });
    }
  });
});

describe('sharing', () => {
  it('builds the public link from the token', () => {
    expect(invoicePublicUrl('https://app.example.com', 'a/b')).toBe(
      'https://app.example.com/invoice/a%2Fb',
    );
  });

  it('builds a WhatsApp link with the amount due, due date and public link', () => {
    const { url, message, whatsAppUrl } = buildInvoiceShareLinks(
      invoice({ balanceDue: 100_000 }),
      'Sparkle Cleaning',
      'https://app.example.com',
    );
    expect(url).toBe('https://app.example.com/invoice/tok_abc');
    expect(message).toContain('Hi Olivia,');
    expect(message).toContain('invoice INV-0007 from Sparkle Cleaning');
    expect(message).toContain('Amount due: $1,000.00, due by Nov 15, 2026.');
    expect(message).toContain(url);
    expect(whatsAppUrl).toBe(`https://wa.me/15550101234?text=${encodeURIComponent(message)}`);
  });
});

describe('invoiceOutlook', () => {
  const today = '2026-11-10';

  it('shows the balance with its due date and how much is paid', () => {
    expect(
      invoiceOutlook(invoice({ amountPaid: 25_000, balanceDue: 100_000 }), today, 'UTC'),
    ).toEqual({
      label: 'Balance due',
      amount: 100_000,
      line: 'Due in 5 days · Nov 15, 2026',
      paidShare: 0.2,
    });
    expect(invoiceOutlook(invoice({ status: 'draft' }), today, 'UTC')).toMatchObject({
      line: 'Not sent yet · due Nov 15, 2026',
      paidShare: null,
    });
  });

  it('counts the days an overdue invoice is late', () => {
    expect(
      invoiceOutlook(invoice({ status: 'overdue', dueDate: '2026-11-06' }), today, 'UTC').line,
    ).toBe('4 days overdue · was due Nov 6, 2026');
  });

  it('shows the total once nothing is owed', () => {
    expect(
      invoiceOutlook(
        invoice({ status: 'paid', amountPaid: 125_000, balanceDue: 0, paidAt: '2026-11-08' }),
        today,
        'UTC',
      ),
    ).toEqual({
      label: 'Paid in full',
      amount: 125_000,
      line: 'Last payment on Nov 8, 2026',
      paidShare: 1,
    });
    expect(
      invoiceOutlook(
        invoice({ status: 'cancelled', cancelledAt: '2026-11-09T15:00:00.000Z' }),
        today,
        'UTC',
      ),
    ).toMatchObject({ label: 'Cancelled', amount: 125_000, paidShare: null });
  });
});

import type {
  DashboardAwaitingQuoteDto,
  InvoiceListItemDto,
  QuoteListItemDto,
} from '@quoteflow/shared';
import { describe, expect, it } from 'vitest';
import { attentionItems } from './attention';

const TODAY = '2026-10-10';

const quote = (quoteNumber: string, status: QuoteListItemDto['status']): QuoteListItemDto => ({
  id: quoteNumber,
  quoteNumber,
  status,
  currency: 'NGN',
  customerId: 'c1',
  customerName: 'Musa Ibrahim',
  total: 4_622_500,
  issueDate: '2026-10-05',
  expiryDate: '2026-10-19',
  invoiceId: null,
  createdAt: '2026-10-05T09:00:00.000Z',
});

const awaiting = (quoteNumber: string, status: 'sent' | 'viewed'): DashboardAwaitingQuoteDto => ({
  ...quote(quoteNumber, status),
  publicToken: `token-${quoteNumber}`,
  customerPhone: null,
});

const invoice = (status: InvoiceListItemDto['status'], dueDate: string): InvoiceListItemDto => ({
  id: dueDate,
  invoiceNumber: `INV-${dueDate}`,
  status,
  currency: 'NGN',
  customerId: 'c1',
  customerName: 'Dr. Ngozi Eze',
  total: 100,
  balanceDue: 100,
  issueDate: '2026-08-01',
  dueDate,
  createdAt: '2026-08-01T09:00:00.000Z',
});

function dashboard({ overdueCount = 0, acceptedNotInvoiced = 0, viewed = 0 }) {
  return {
    quotes: { total: 9, pending: 4, viewed, accepted: 7, acceptedNotInvoiced },
    invoices: {
      total: 8,
      totalInvoiced: 0,
      amountPaid: 0,
      outstanding: 0,
      outstandingCount: 4,
      overdueCount,
      overdueAmount: 13_061_250,
    },
    readyToInvoice: [] as QuoteListItemDto[],
    awaitingQuotes: [] as DashboardAwaitingQuoteDto[],
    upcomingInvoices: [] as InvoiceListItemDto[],
  };
}

describe('attentionItems', () => {
  it('puts overdue money first, then quotes to invoice, then opened quotes', () => {
    const data = {
      ...dashboard({ overdueCount: 2, acceptedNotInvoiced: 1, viewed: 1 }),
      upcomingInvoices: [
        invoice('overdue', '2026-09-07'),
        invoice('overdue', '2026-09-19'),
        invoice('sent', '2026-10-14'),
      ],
      readyToInvoice: [quote('Q-13', 'accepted')],
      awaitingQuotes: [awaiting('Q-15', 'sent'), awaiting('Q-14', 'viewed')],
    };

    const { items, total } = attentionItems(data, TODAY);

    expect(total).toBe(3);
    expect(items[0]).toEqual({ kind: 'overdue', count: 2, amount: 13_061_250, oldestDays: 33 });
    expect(
      items.slice(1).map((item) => [item.kind, 'quote' in item && item.quote.quoteNumber]),
    ).toEqual([
      ['ready', 'Q-13'],
      ['viewed', 'Q-14'],
    ]);
  });

  it('shows three jobs at most but counts them all', () => {
    const data = {
      ...dashboard({ acceptedNotInvoiced: 4, viewed: 2 }),
      readyToInvoice: ['Q-1', 'Q-2', 'Q-3', 'Q-4'].map((number) => quote(number, 'accepted')),
      awaitingQuotes: [awaiting('Q-5', 'viewed'), awaiting('Q-6', 'viewed')],
    };

    const { items, total } = attentionItems(data, TODAY);

    expect(items).toHaveLength(3);
    expect(total).toBe(6);
  });

  it('adds the setup steps left last', () => {
    const step = (id: 'business' | 'service', done: boolean) => ({
      id,
      title: id,
      description: '',
      to: '/',
      action: '',
      done,
    });
    const checklist = [step('business', true), step('service', false)];

    const { items, total } = attentionItems(dashboard({ viewed: 0 }), TODAY, checklist);

    expect(items).toEqual([{ kind: 'setup', done: 1, total: 2, next: checklist[1] }]);
    expect(total).toBe(1);
    expect(attentionItems(dashboard({}), TODAY, [step('business', true)]).items).toEqual([]);
  });

  it('is empty when nothing needs the owner', () => {
    expect(attentionItems(dashboard({}), TODAY)).toEqual({ items: [], total: 0 });
  });
});

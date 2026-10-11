import { describe, expect, it } from 'vitest';
import { quoteOutlook, quoteStamp, quoteSteps } from './quote-outlook';

const live = {
  status: 'sent' as const,
  expiryDate: '2026-10-15',
  acceptedAt: null,
  rejectedAt: null,
};

describe('quoteOutlook', () => {
  it('counts the days a live quote is still valid', () => {
    expect(quoteOutlook(live, '2026-10-09', 'UTC')).toBe('Valid until Oct 15, 2026 · 6 days left');
    expect(quoteOutlook(live, '2026-10-14', 'UTC')).toBe('Valid until Oct 15, 2026 · 1 day left');
    expect(quoteOutlook(live, '2026-10-15', 'UTC')).toBe(
      'Valid until Oct 15, 2026 · last day today',
    );
  });

  it('says how a quote ended, in the business time zone', () => {
    expect(
      quoteOutlook(
        { ...live, status: 'accepted', acceptedAt: '2026-10-10T02:00:00Z' },
        '2026-10-12',
        'America/Chicago',
      ),
    ).toBe('Accepted on Oct 9, 2026');
    expect(
      quoteOutlook(
        { ...live, status: 'rejected', rejectedAt: '2026-10-11T12:00:00Z' },
        '2026-10-12',
        'UTC',
      ),
    ).toBe('Declined on Oct 11, 2026');
    expect(quoteOutlook({ ...live, status: 'expired' }, '2026-10-20', 'UTC')).toBe(
      'Expired after Oct 15, 2026',
    );
  });
});

describe('quoteSteps', () => {
  const states = (quote: Parameters<typeof quoteSteps>[0]) =>
    quoteSteps(quote).map((step) => `${step.label}:${step.state}`);

  it('walks from created to invoiced', () => {
    expect(states({ status: 'draft', sentAt: null, viewedAt: null, invoiceId: null })).toEqual([
      'Created:done',
      'Sent:todo',
      'Viewed:todo',
      'Accepted:todo',
      'Invoiced:todo',
    ]);
    expect(states({ status: 'accepted', sentAt: 'x', viewedAt: 'x', invoiceId: 'inv' })).toEqual([
      'Created:done',
      'Sent:done',
      'Viewed:done',
      'Accepted:done',
      'Invoiced:done',
    ]);
  });

  it('ends at declined or expired instead', () => {
    expect(states({ status: 'rejected', sentAt: 'x', viewedAt: 'x', invoiceId: null })).toEqual([
      'Created:done',
      'Sent:done',
      'Viewed:done',
      'Declined:stopped',
    ]);
    expect(states({ status: 'expired', sentAt: 'x', viewedAt: null, invoiceId: null })).toEqual([
      'Created:done',
      'Sent:done',
      'Viewed:todo',
      'Expired:stopped',
    ]);
  });
});

describe('quoteStamp', () => {
  it('stamps a draft with a dashed "Draft" and waits while the quote is out', () => {
    expect(quoteStamp({ ...live, status: 'draft' }, 'UTC')).toEqual({
      tone: 'draft',
      label: 'Draft',
    });
    expect(quoteStamp(live, 'UTC')).toBeUndefined();
    expect(quoteStamp({ ...live, status: 'viewed' }, 'UTC')).toBeUndefined();
  });

  it('stamps the answer with its day and time in the business time zone', () => {
    expect(
      quoteStamp(
        { ...live, status: 'accepted', acceptedAt: '2026-10-05T09:47:00Z' },
        'Africa/Lagos',
      ),
    ).toEqual({ tone: 'accepted', label: 'Accepted', detail: 'Oct 5 · 10:47' });
    expect(
      quoteStamp({ ...live, status: 'rejected', rejectedAt: '2026-10-11T12:05:00Z' }, 'UTC'),
    ).toMatchObject({ tone: 'declined', detail: 'Oct 11 · 12:05' });
    expect(quoteStamp({ ...live, status: 'expired' }, 'UTC')).toEqual({
      tone: 'expired',
      label: 'Expired',
      detail: 'Oct 15, 2026',
    });
  });
});

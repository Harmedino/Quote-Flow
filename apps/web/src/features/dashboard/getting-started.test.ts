import { describe, expect, it } from 'vitest';
import { gettingStartedChecklist, hasBusinessDetails } from './getting-started';

const emptyBusiness = { email: null, phone: null, address: {} };
const emptyDashboard = {
  quotes: { total: 0, pending: 0, accepted: 0, acceptedNotInvoiced: 0 },
  recentCustomers: [],
};

describe('gettingStartedChecklist', () => {
  it('leaves every step open for a new business', () => {
    const items = gettingStartedChecklist(emptyBusiness, emptyDashboard, 0);
    expect(items.map((item) => [item.id, item.done])).toEqual([
      ['business', false],
      ['service', false],
      ['customer', false],
      ['quote', false],
    ]);
  });

  it('ticks steps from the data', () => {
    const items = gettingStartedChecklist(
      { email: 'hi@example.com', phone: null, address: { city: 'Lagos' } },
      {
        quotes: { total: 1, pending: 1, accepted: 0, acceptedNotInvoiced: 0 },
        recentCustomers: [
          {
            id: 'c1',
            name: 'Ada',
            email: null,
            phone: null,
            company: null,
            address: {},
            notes: null,
            archivedAt: null,
            createdAt: '2026-10-08T00:00:00.000Z',
            updatedAt: '2026-10-08T00:00:00.000Z',
          },
        ],
      },
      3,
    );
    expect(items.every((item) => item.done)).toBe(true);
  });
});

describe('hasBusinessDetails', () => {
  it('needs both a way to get in touch and an address', () => {
    expect(hasBusinessDetails({ email: 'a@b.co', phone: null, address: {} })).toBe(false);
    expect(hasBusinessDetails({ email: null, phone: null, address: { line1: '1 Way' } })).toBe(
      false,
    );
    expect(hasBusinessDetails({ email: null, phone: '+1 555', address: { line1: '1 Way' } })).toBe(
      true,
    );
  });
});

import { INVOICE_STATUSES, QUOTE_STATUSES } from '@quoteflow/shared';
import { describe, expect, it } from 'vitest';
import { DEMO_OWNER_EMAIL, DEMO_USERS } from './business';
import { QUOTE_PLANS, STANDALONE_INVOICE_PLANS } from './documents';

describe('demo seed plans', () => {
  it('cover every quote status', () => {
    expect(new Set(QUOTE_PLANS.map((plan) => plan.status))).toEqual(new Set(QUOTE_STATUSES));
  });

  it('cover every invoice status, from both converted quotes and standalone invoices', () => {
    const converted = QUOTE_PLANS.flatMap((plan) => (plan.invoice ? [plan.invoice.status] : []));
    const standalone = STANDALONE_INVOICE_PLANS.map((plan) => plan.status);

    expect(converted.length).toBeGreaterThan(1);
    expect(standalone.length).toBeGreaterThan(1);
    expect(new Set([...converted, ...standalone])).toEqual(new Set(INVOICE_STATUSES));
  });

  it('only convert accepted quotes', () => {
    for (const plan of QUOTE_PLANS.filter((candidate) => candidate.invoice)) {
      expect(plan.status).toBe('accepted');
    }
  });

  it('use reserved domains for demo logins', () => {
    for (const user of Object.values(DEMO_USERS)) {
      expect(user.email).toMatch(/@[a-z-]+\.test$/);
    }
    expect(DEMO_USERS.owner.email).toBe(DEMO_OWNER_EMAIL);
  });
});

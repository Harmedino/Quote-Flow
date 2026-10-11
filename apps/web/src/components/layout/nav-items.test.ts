import { describe, expect, it } from 'vitest';
import { paths } from '@/app/paths';
import {
  hasOwnBottomBar,
  isNavItemActive,
  MOBILE_MORE_ITEMS,
  MOBILE_TAB_ITEMS,
  navCount,
  PRIMARY_NAV_ITEMS,
} from './nav-items';

const byPath = (to: string) => PRIMARY_NAV_ITEMS.find((item) => item.to === to)!;
const quotes = byPath(paths.quotes);
const invoices = byPath(paths.invoices);

describe('nav items', () => {
  it('marks a section active on its own page and the pages below it only', () => {
    expect(isNavItemActive(paths.quotes, quotes)).toBe(true);
    expect(isNavItemActive(paths.quote('q1'), quotes)).toBe(true);
    expect(isNavItemActive('/quotesx', quotes)).toBe(false);
  });

  it('reaches every desktop tab and settings from the phone', () => {
    const phone = [...MOBILE_TAB_ITEMS.start, ...MOBILE_TAB_ITEMS.end, ...MOBILE_MORE_ITEMS];

    for (const item of PRIMARY_NAV_ITEMS) expect(phone).toContain(item);
    expect(phone.map((item) => item.to)).toContain(paths.settings);
  });

  it('counts quotes awaiting an answer and overdue invoices, and hides zeros', () => {
    const counts = { awaitingQuotes: 4, overdueInvoices: 2 };

    expect(navCount(quotes, counts)).toEqual({
      value: 4,
      tone: 'neutral',
      label: 'awaiting an answer',
    });
    expect(navCount(invoices, counts)).toMatchObject({ value: 2, tone: 'alert' });
    expect(navCount(invoices, { awaitingQuotes: 4, overdueInvoices: 0 })).toBeNull();
    expect(navCount(byPath(paths.customers), counts)).toBeNull();
    expect(navCount(quotes, undefined)).toBeNull();
  });

  it('knows which screens bring their own bottom action bar', () => {
    expect(hasOwnBottomBar(paths.newQuote)).toBe(true);
    expect(hasOwnBottomBar(paths.editQuote('q1'))).toBe(true);
    expect(hasOwnBottomBar(paths.quote('q1'))).toBe(false);
    expect(hasOwnBottomBar(paths.newInvoice)).toBe(false);
  });
});

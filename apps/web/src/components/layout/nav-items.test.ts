import { describe, expect, it } from 'vitest';
import { paths } from '@/app/paths';
import {
  currentSectionLabel,
  hasOwnBottomBar,
  isNavItemActive,
  PRIMARY_NAV_ITEMS,
} from './nav-items';

const quotes = PRIMARY_NAV_ITEMS.find((item) => item.to === paths.quotes)!;

describe('nav items', () => {
  it('marks a section active on its own page and the pages below it only', () => {
    expect(isNavItemActive(paths.quotes, quotes)).toBe(true);
    expect(isNavItemActive(paths.quote('q1'), quotes)).toBe(true);
    expect(isNavItemActive('/quotesx', quotes)).toBe(false);
  });

  it('names the current section for the phone top bar', () => {
    expect(currentSectionLabel(paths.editInvoice('i1'))).toBe('Invoices');
    expect(currentSectionLabel(paths.accountSettings)).toBe('Settings');
    expect(currentSectionLabel('/somewhere-else')).toBeUndefined();
  });

  it('knows which screens bring their own bottom action bar', () => {
    expect(hasOwnBottomBar(paths.newQuote)).toBe(true);
    expect(hasOwnBottomBar(paths.editQuote('q1'))).toBe(true);
    expect(hasOwnBottomBar(paths.quote('q1'))).toBe(false);
    expect(hasOwnBottomBar(paths.newInvoice)).toBe(false);
  });
});

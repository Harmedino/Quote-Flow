import {
  FileText,
  LayoutDashboard,
  type LucideIcon,
  Receipt,
  Settings,
  Users,
  Wrench,
} from 'lucide-react';
import { matchPath } from 'react-router';
import { paths } from '@/app/paths';

export interface NavItem {
  label: string;
  /** A shorter label for the phone tab bar, where space is tight. */
  shortLabel?: string;
  to: string;
  icon: LucideIcon;
}

const DASHBOARD: NavItem = {
  label: 'Dashboard',
  shortLabel: 'Home',
  to: paths.dashboard,
  icon: LayoutDashboard,
};
const QUOTES: NavItem = { label: 'Quotes', to: paths.quotes, icon: FileText };
const INVOICES: NavItem = { label: 'Invoices', to: paths.invoices, icon: Receipt };
const CUSTOMERS: NavItem = { label: 'Customers', to: paths.customers, icon: Users };
const SERVICES: NavItem = { label: 'Services', to: paths.services, icon: Wrench };

export const PRIMARY_NAV_ITEMS: readonly NavItem[] = [
  DASHBOARD,
  QUOTES,
  INVOICES,
  CUSTOMERS,
  SERVICES,
];

export const SETTINGS_NAV_ITEM: NavItem = { label: 'Settings', to: paths.settings, icon: Settings };

/** The phone tab bar: the screens used every day. The "+" button sits between them. */
export const MOBILE_TAB_ITEMS = { start: [DASHBOARD, QUOTES], end: INVOICES } as const;

/** Everything else, in the phone "More" sheet. */
export const MOBILE_MORE_ITEMS: readonly NavItem[] = [CUSTOMERS, SERVICES, SETTINGS_NAV_ITEM];

export function isNavItemActive(pathname: string, item: NavItem): boolean {
  return pathname === item.to || pathname.startsWith(`${item.to}/`);
}

/** The label of the section the user is in, for the phone top bar. */
export function currentSectionLabel(pathname: string): string | undefined {
  return [...PRIMARY_NAV_ITEMS, SETTINGS_NAV_ITEM].find((item) => isNavItemActive(pathname, item))
    ?.label;
}

/**
 * Screens that pin their own action bar to the bottom of a phone screen (the quote editor's
 * total and save buttons). The tab bar steps aside there, so the two never stack.
 */
const OWN_BOTTOM_BAR_ROUTES = [paths.newQuote, '/quotes/:quoteId/edit'];

export function hasOwnBottomBar(pathname: string): boolean {
  return OWN_BOTTOM_BAR_ROUTES.some((pattern) => matchPath(pattern, pathname) !== null);
}

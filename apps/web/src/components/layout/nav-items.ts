import {
  FileText,
  LayoutDashboard,
  type LucideIcon,
  ReceiptText,
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
const INVOICES: NavItem = { label: 'Invoices', to: paths.invoices, icon: ReceiptText };
const CUSTOMERS: NavItem = { label: 'Customers', to: paths.customers, icon: Users };
const SERVICES: NavItem = { label: 'Services', to: paths.services, icon: Wrench };

/** The desktop top bar's tabs. */
export const PRIMARY_NAV_ITEMS: readonly NavItem[] = [
  DASHBOARD,
  QUOTES,
  INVOICES,
  CUSTOMERS,
  SERVICES,
];

export const SETTINGS_NAV_ITEM: NavItem = { label: 'Settings', to: paths.settings, icon: Settings };

/** The phone tab bar: the screens used every day, either side of the New key. */
export const MOBILE_TAB_ITEMS = {
  start: [DASHBOARD, QUOTES],
  end: [INVOICES, CUSTOMERS],
} as const;

/** The rest, in the phone's account sheet (opened from the business name). */
export const MOBILE_MORE_ITEMS: readonly NavItem[] = [SERVICES, SETTINGS_NAV_ITEM];

export function isNavItemActive(pathname: string, item: NavItem): boolean {
  return pathname === item.to || pathname.startsWith(`${item.to}/`);
}

/** What the tabs count, from the dashboard figures. */
export interface NavCounts {
  /** Quotes sent or viewed and not answered yet. */
  awaitingQuotes: number;
  overdueInvoices: number;
}

export interface NavCount {
  value: number;
  /** `alert` (solid red) for counts that need action. */
  tone: 'neutral' | 'alert';
  /** What is counted, for screen readers. */
  label: string;
}

/** The count chip beside a tab, if it has one and it isn't zero. */
export function navCount(item: NavItem, counts: NavCounts | undefined): NavCount | null {
  if (!counts) return null;
  if (item === QUOTES && counts.awaitingQuotes > 0) {
    return { value: counts.awaitingQuotes, tone: 'neutral', label: 'awaiting an answer' };
  }
  if (item === INVOICES && counts.overdueInvoices > 0) {
    return { value: counts.overdueInvoices, tone: 'alert', label: 'overdue' };
  }
  return null;
}

/**
 * Screens that pin their own action bar to the bottom of a phone screen (the quote editor's
 * total and save buttons). The tab bar steps aside there, so the two never stack.
 */
const OWN_BOTTOM_BAR_ROUTES = [paths.newQuote, '/quotes/:quoteId/edit'];

export function hasOwnBottomBar(pathname: string): boolean {
  return OWN_BOTTOM_BAR_ROUTES.some((pattern) => matchPath(pattern, pathname) !== null);
}

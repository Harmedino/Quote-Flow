import {
  FileText,
  LayoutDashboard,
  type LucideIcon,
  Receipt,
  Settings,
  Users,
  Wrench,
} from 'lucide-react';
import { paths } from '@/app/paths';

export interface NavItem {
  label: string;
  to: string;
  icon: LucideIcon;
}

export const PRIMARY_NAV_ITEMS: readonly NavItem[] = [
  { label: 'Dashboard', to: paths.dashboard, icon: LayoutDashboard },
  { label: 'Quotes', to: paths.quotes, icon: FileText },
  { label: 'Invoices', to: paths.invoices, icon: Receipt },
  { label: 'Customers', to: paths.customers, icon: Users },
  { label: 'Services', to: paths.services, icon: Wrench },
];

export const SETTINGS_NAV_ITEM: NavItem = { label: 'Settings', to: paths.settings, icon: Settings };

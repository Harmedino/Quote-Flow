import type { BusinessDto, DashboardDto } from '@quoteflow/shared';
import { paths } from '@/app/paths';

export interface ChecklistItem {
  id: 'business' | 'service' | 'customer' | 'quote';
  title: string;
  description: string;
  to: string;
  action: string;
  done: boolean;
}

/** Customers need a way to reach the business, and documents print its address. */
export function hasBusinessDetails(business: Pick<BusinessDto, 'email' | 'phone' | 'address'>) {
  const hasContact = Boolean(business.email || business.phone);
  const hasAddress = Object.values(business.address).some((part) => Boolean(part?.trim()));
  return hasContact && hasAddress;
}

export function gettingStartedChecklist(
  business: Pick<BusinessDto, 'email' | 'phone' | 'address'>,
  dashboard: Pick<DashboardDto, 'quotes' | 'recentCustomers'>,
  serviceCount: number,
): ChecklistItem[] {
  return [
    {
      id: 'business',
      title: 'Complete your business details',
      description: 'Add your contact details, address, currency and brand colour.',
      to: paths.businessSettings,
      action: 'Open settings',
      done: hasBusinessDetails(business),
    },
    {
      id: 'service',
      title: 'Add a service',
      description: 'Save what you sell once and add it to any quote in a click.',
      to: paths.services,
      action: 'Add a service',
      done: serviceCount > 0,
    },
    {
      id: 'customer',
      title: 'Add a customer',
      description: 'Keep contact details in one place for quotes and invoices.',
      to: paths.customers,
      action: 'Add a customer',
      done: dashboard.recentCustomers.length > 0,
    },
    {
      id: 'quote',
      title: 'Create your first quote',
      description: 'Build it in minutes, then share it by link or WhatsApp.',
      to: paths.newQuote,
      action: 'New quote',
      done: dashboard.quotes.total > 0,
    },
  ];
}

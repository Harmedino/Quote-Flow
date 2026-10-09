import type { BusinessDto, CustomerDto } from '@quoteflow/shared';
import { FilePlus2, type LucideIcon, ReceiptText, UserPlus, Wrench } from 'lucide-react';
import { Link } from 'react-router';
import { paths } from '@/app/paths';
import { normalizeBrandColor, textColorOn } from '@/components/documents/brand-color';
import { Avatar } from '@/components/ui/Avatar';
import { Card } from '@/components/ui/Card';
import { TextLink } from '@/components/ui/TextLink';
import { initials } from '@/features/auth/user-display';
import { formatDate } from '@/lib/format';
import { timeZoneLabel } from '@/lib/locale';

const QUICK_ACTIONS: readonly { label: string; to: string; icon: LucideIcon }[] = [
  { label: 'New quote', to: paths.newQuote, icon: FilePlus2 },
  { label: 'New invoice', to: paths.newInvoice, icon: ReceiptText },
  { label: 'Add a customer', to: paths.newCustomer, icon: UserPlus },
  { label: 'Add a service', to: paths.newService, icon: Wrench },
];

/** The business tile in its own brand colour, as customers see it on quotes. */
function BusinessTile({ business }: { business: BusinessDto }) {
  const color = normalizeBrandColor(business.brandColor);
  return (
    <span
      aria-hidden="true"
      className="flex size-10 shrink-0 items-center justify-center rounded-xl text-sm font-semibold"
      style={{ backgroundColor: color, color: textColorOn(color) }}
    >
      {initials(business.name) || '?'}
    </span>
  );
}

/** The side card: the business at a glance, shortcuts and the newest customers. */
export function BusinessSnapshot({
  business,
  canEditBusiness,
  customers,
}: {
  business: BusinessDto;
  canEditBusiness: boolean;
  customers: readonly CustomerDto[];
}) {
  return (
    <Card className="divide-y divide-stone-200">
      <div className="p-5">
        <div className="flex items-center gap-3">
          <BusinessTile business={business} />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-stone-900">{business.name}</p>
            <p className="truncate text-xs text-stone-500">
              {business.currency} · {timeZoneLabel(business.timezone, new Date())}
            </p>
          </div>
        </div>
        {canEditBusiness && (
          <TextLink to={paths.businessSettings} className="mt-3 inline-block text-sm">
            Edit business details
          </TextLink>
        )}
      </div>

      <div className="p-5">
        <p className="section-label">Quick actions</p>
        <ul className="mt-2 space-y-0.5">
          {QUICK_ACTIONS.map(({ label, to, icon: Icon }) => (
            <li key={label}>
              <Link
                to={to}
                className="-mx-2.5 flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium text-stone-700 transition-colors hover:bg-stone-100 hover:text-stone-900"
              >
                <Icon aria-hidden="true" className="size-4 shrink-0 text-stone-500" />
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <div className="p-5">
        <div className="flex items-center justify-between gap-3">
          <p className="section-label">New customers</p>
          {customers.length > 0 && (
            <TextLink to={paths.customers} className="text-sm">
              View all<span className="sr-only"> customers</span>
            </TextLink>
          )}
        </div>
        {customers.length === 0 ? (
          <p className="mt-2 text-sm text-stone-500">
            Customers you add show here, ready for their first quote.
          </p>
        ) : (
          <ul className="mt-2 space-y-0.5">
            {customers.map((customer) => (
              <li key={customer.id}>
                <Link
                  to={paths.customer(customer.id)}
                  className="-mx-2.5 flex items-center gap-2.5 rounded-lg px-2.5 py-2 transition-colors hover:bg-stone-100"
                >
                  <Avatar name={customer.name} size="xs" />
                  <span className="min-w-0 flex-1 truncate text-sm font-medium text-stone-800">
                    {customer.name}
                  </span>
                  <span className="shrink-0 text-xs text-stone-500">
                    {formatDate(customer.createdAt, {
                      timeZone: business.timezone,
                      dateStyle: 'medium',
                    })}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Card>
  );
}

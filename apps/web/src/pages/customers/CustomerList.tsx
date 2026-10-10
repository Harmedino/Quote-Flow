import type { CustomerDto } from '@quoteflow/shared';
import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router';
import { paths } from '@/app/paths';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { useAuthenticatedSession } from '@/features/auth/use-session';
import { cn } from '@/lib/cn';
import { formatDate } from '@/lib/format';

function ArchivedBadge() {
  return <Badge tone="neutral">Archived</Badge>;
}

const HEAD =
  'px-4 py-3 text-left text-xs font-medium tracking-wide whitespace-nowrap text-stone-500 uppercase';
const EMPTY = <span className="text-stone-400">—</span>;

/** Customers as a table from `md` up and as rows with initials below it, inside the list panel. */
export function CustomerList({ customers }: { customers: CustomerDto[] }) {
  const { business } = useAuthenticatedSession();
  const added = (customer: CustomerDto) =>
    formatDate(customer.createdAt, { timeZone: business.timezone });

  return (
    <>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full text-sm">
          <thead className="bg-surface-muted">
            <tr>
              <th scope="col" className={cn(HEAD, 'pl-5')}>
                Name
              </th>
              <th scope="col" className={HEAD}>
                Phone
              </th>
              <th scope="col" className={HEAD}>
                Email
              </th>
              <th scope="col" className={cn(HEAD, 'pr-5 text-right')}>
                Added
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {customers.map((customer) => (
              <tr
                key={customer.id}
                className="group relative transition-colors focus-within:bg-stone-50 hover:bg-stone-50"
              >
                <td className="max-w-80 py-3 pr-4 pl-5">
                  <div className="flex items-center gap-3">
                    <Avatar name={customer.name} size="sm" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        {/* The link covers the whole row, so any part of it opens the customer. */}
                        <Link
                          to={paths.customer(customer.id)}
                          className="truncate rounded-sm font-medium text-stone-900 after:absolute after:inset-0 group-hover:text-brand-700"
                        >
                          {customer.name}
                        </Link>
                        {customer.archivedAt && <ArchivedBadge />}
                      </div>
                      {customer.company && (
                        <p className="truncate text-xs text-stone-500">{customer.company}</p>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-stone-600 tabular-nums">
                  {customer.phone ?? EMPTY}
                </td>
                <td className="max-w-64 truncate px-4 py-3 text-stone-600">
                  {customer.email ?? EMPTY}
                </td>
                <td className="py-3 pr-5 pl-4 text-right whitespace-nowrap text-stone-500">
                  {added(customer)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="divide-y divide-stone-100 md:hidden">
        {customers.map((customer) => {
          const secondary = [customer.company, customer.phone ?? customer.email]
            .filter(Boolean)
            .join(' · ');
          return (
            <li key={customer.id}>
              <Link
                to={paths.customer(customer.id)}
                className="flex items-center gap-3 px-3.5 py-3 transition-colors hover:bg-stone-50 focus-visible:outline-offset-[-2px] active:bg-stone-100"
              >
                <Avatar name={customer.name} size="md" />
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2">
                    <span className="truncate font-medium text-stone-900">{customer.name}</span>
                    {customer.archivedAt && <ArchivedBadge />}
                  </p>
                  <p className="truncate text-sm text-stone-500">
                    {secondary || `Added ${added(customer)}`}
                  </p>
                </div>
                <ChevronRight aria-hidden="true" className="size-4 shrink-0 text-stone-400" />
              </Link>
            </li>
          );
        })}
      </ul>
    </>
  );
}

export function CustomerListSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div role="status" aria-label="Loading customers" className="divide-y divide-stone-100">
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} className="flex items-center gap-3 px-4 py-3 md:px-5">
          <Skeleton className="size-10 rounded-full md:size-8" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-4 w-40 max-w-full" />
            <Skeleton className="h-3 w-28 md:hidden" />
          </div>
          <Skeleton className="hidden h-4 w-32 md:block" />
          <Skeleton className="hidden h-4 w-48 md:block" />
          <Skeleton className="hidden h-4 w-20 md:block" />
        </div>
      ))}
    </div>
  );
}

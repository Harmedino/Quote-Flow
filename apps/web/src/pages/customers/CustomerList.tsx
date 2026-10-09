import type { CustomerDto } from '@quoteflow/shared';
import { Mail, Phone } from 'lucide-react';
import { Link } from 'react-router';
import { paths } from '@/app/paths';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { useAuthenticatedSession } from '@/features/auth/use-session';
import { formatDate } from '@/lib/format';

function ArchivedBadge() {
  return <Badge tone="neutral">Archived</Badge>;
}

/** Customers as a table from `md` up and as stacked cards below it. */
export function CustomerList({ customers }: { customers: CustomerDto[] }) {
  const { business } = useAuthenticatedSession();
  const added = (customer: CustomerDto) =>
    formatDate(customer.createdAt, { timeZone: business.timezone });

  return (
    <>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50/80 text-xs font-medium tracking-wide text-zinc-500 uppercase">
            <tr>
              <th scope="col" className="px-6 py-3 font-medium">
                Name
              </th>
              <th scope="col" className="px-4 py-3 font-medium">
                Email
              </th>
              <th scope="col" className="px-4 py-3 font-medium">
                Phone
              </th>
              <th scope="col" className="px-6 py-3 text-right font-medium">
                Added
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {customers.map((customer) => (
              <tr key={customer.id} className="group relative transition-colors hover:bg-zinc-50">
                <td className="max-w-72 px-6 py-3.5">
                  <div className="flex items-center gap-2">
                    {/* The link covers the whole row, so any part of it opens the customer. */}
                    <Link
                      to={paths.customer(customer.id)}
                      className="truncate font-medium text-zinc-950 after:absolute after:inset-0 group-hover:text-brand-700"
                    >
                      {customer.name}
                    </Link>
                    {customer.archivedAt && <ArchivedBadge />}
                  </div>
                  {customer.company && (
                    <p className="mt-0.5 truncate text-zinc-500">{customer.company}</p>
                  )}
                </td>
                <td className="max-w-64 truncate px-4 py-3.5 text-zinc-700">
                  {customer.email ?? <span className="text-zinc-400">—</span>}
                </td>
                <td className="px-4 py-3.5 whitespace-nowrap text-zinc-700">
                  {customer.phone ?? <span className="text-zinc-400">—</span>}
                </td>
                <td className="px-6 py-3.5 text-right whitespace-nowrap text-zinc-500">
                  {added(customer)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="divide-y divide-zinc-100 md:hidden">
        {customers.map((customer) => (
          <li key={customer.id}>
            <Link
              to={paths.customer(customer.id)}
              className="block px-4 py-4 transition-colors hover:bg-zinc-50 focus-visible:bg-zinc-50 focus-visible:outline-offset-[-2px] active:bg-zinc-100"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="flex items-center gap-2">
                    <span className="truncate font-medium text-zinc-950">{customer.name}</span>
                    {customer.archivedAt && <ArchivedBadge />}
                  </p>
                  {customer.company && (
                    <p className="mt-0.5 truncate text-sm text-zinc-500">{customer.company}</p>
                  )}
                </div>
                <p className="shrink-0 text-xs text-zinc-500">{added(customer)}</p>
              </div>
              {(customer.email || customer.phone) && (
                <div className="mt-2 space-y-1 text-sm text-zinc-600">
                  {customer.email && (
                    <p className="flex items-center gap-2 truncate">
                      <Mail aria-hidden="true" className="size-3.5 shrink-0 text-zinc-400" />
                      <span className="truncate">{customer.email}</span>
                    </p>
                  )}
                  {customer.phone && (
                    <p className="flex items-center gap-2">
                      <Phone aria-hidden="true" className="size-3.5 shrink-0 text-zinc-400" />
                      {customer.phone}
                    </p>
                  )}
                </div>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}

export function CustomerListSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div role="status" aria-label="Loading customers" className="divide-y divide-zinc-100">
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} className="flex items-center gap-6 px-4 py-4 sm:px-6">
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-28" />
          </div>
          <Skeleton className="hidden h-4 w-48 md:block" />
          <Skeleton className="hidden h-4 w-32 md:block" />
          <Skeleton className="h-4 w-20" />
        </div>
      ))}
    </div>
  );
}

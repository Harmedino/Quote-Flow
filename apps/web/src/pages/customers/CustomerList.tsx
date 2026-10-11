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
  'border-y border-line px-3 py-2 text-left label-mono font-medium whitespace-nowrap text-muted';
const CELL = 'border-b border-line px-3 py-2.5';
const EMPTY = <span className="text-muted">—</span>;

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
              <th scope="col" className={cn(HEAD, 'pl-6')}>
                Name
              </th>
              <th scope="col" className={HEAD}>
                Phone
              </th>
              <th scope="col" className={HEAD}>
                Email
              </th>
              <th scope="col" className={cn(HEAD, 'pr-6 text-right')}>
                Added
              </th>
            </tr>
          </thead>
          <tbody className="[&>tr:last-child>td]:border-b-0">
            {customers.map((customer) => (
              <tr
                key={customer.id}
                className="group relative transition-colors focus-within:bg-surface-muted hover:bg-surface-muted"
              >
                <td className={cn(CELL, 'max-w-80 pl-6')}>
                  <div className="flex items-center gap-3">
                    <Avatar name={customer.name} size="sm" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        {/* The link covers the whole row, so any part of it opens the customer. */}
                        <Link
                          to={paths.customer(customer.id)}
                          className="truncate rounded-sm font-[650] text-ink after:absolute after:inset-0 group-hover:text-primary-ink"
                        >
                          {customer.name}
                        </Link>
                        {customer.archivedAt && <ArchivedBadge />}
                      </div>
                      {customer.company && (
                        <p className="truncate text-[12.5px] text-muted">{customer.company}</p>
                      )}
                    </div>
                  </div>
                </td>
                <td className={cn(CELL, 'whitespace-nowrap text-ink-2 tabular-nums')}>
                  {customer.phone ?? EMPTY}
                </td>
                <td className={cn(CELL, 'max-w-64 truncate text-ink-2')}>
                  {customer.email ?? EMPTY}
                </td>
                <td
                  className={cn(CELL, 'pr-6 text-right text-[13px] whitespace-nowrap text-muted')}
                >
                  {added(customer)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="divide-y divide-line md:hidden">
        {customers.map((customer) => {
          const secondary = [customer.company, customer.phone ?? customer.email]
            .filter(Boolean)
            .join(' · ');
          return (
            <li key={customer.id}>
              <Link
                to={paths.customer(customer.id)}
                className="grid grid-cols-[36px_minmax(0,1fr)_auto] items-center gap-3 px-3.5 py-3 transition-colors hover:bg-surface-muted focus-visible:outline-offset-[-2px] active:bg-canvas-deep"
              >
                <Avatar name={customer.name} size="md" />
                <span className="min-w-0">
                  <span className="flex items-center gap-2">
                    <span className="truncate text-[14.5px] font-semibold text-ink">
                      {customer.name}
                    </span>
                    {customer.archivedAt && <ArchivedBadge />}
                  </span>
                  <span className="mt-px block truncate text-[12.5px] text-muted">
                    {secondary || `Added ${added(customer)}`}
                  </span>
                </span>
                <ChevronRight aria-hidden="true" className="size-4 text-muted" />
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
    <div role="status" aria-label="Loading customers" className="divide-y divide-line">
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} className="flex items-center gap-3 px-3.5 py-3 md:px-6">
          <Skeleton className="size-9 md:size-8" />
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

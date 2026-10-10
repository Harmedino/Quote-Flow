import type { ServiceDto } from '@quoteflow/shared';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { useAuthenticatedSession } from '@/features/auth/use-session';
import { useUpdateService } from '@/features/services/use-services';
import { getErrorMessage } from '@/lib/api-client';
import { cn } from '@/lib/cn';
import { formatMoney } from '@/lib/format';

export interface ServiceListProps {
  services: ServiceDto[];
  onEdit: (service: ServiceDto) => void;
  onDelete: (service: ServiceDto) => void;
}

/** Turns a service on or off for new quotes, right from the list. */
function ActiveSwitch({ service }: { service: ServiceDto }) {
  const update = useUpdateService();
  // Shows the requested state while the change is saving.
  const active = update.isPending ? !service.active : service.active;

  return (
    <div className="flex flex-col items-start gap-1">
      <button
        type="button"
        role="switch"
        aria-checked={active}
        aria-label={`Active: ${service.name}`}
        disabled={update.isPending}
        onClick={() => update.mutate({ id: service.id, input: { active: !service.active } })}
        className="group inline-flex items-center gap-2 rounded-full text-sm font-medium disabled:opacity-70"
      >
        <span
          aria-hidden="true"
          className={cn(
            'relative inline-flex h-5 w-9 shrink-0 rounded-full transition-colors',
            active ? 'bg-brand-600' : 'bg-stone-300 group-hover:bg-stone-400',
          )}
        >
          <span
            className={cn(
              'absolute top-0.5 left-0.5 size-4 rounded-full bg-white shadow-sm transition-transform',
              active && 'translate-x-4',
            )}
          />
        </span>
        <span className={active ? 'text-stone-900' : 'text-stone-500'}>
          {active ? 'Active' : 'Inactive'}
        </span>
      </button>
      {update.isError && (
        <p role="alert" className="text-xs text-red-700">
          {getErrorMessage(update.error)}
        </p>
      )}
    </div>
  );
}

/** ServiceBook's quiet text actions; each names its service for assistive technology. */
function ServiceActions({
  service,
  onEdit,
  onDelete,
}: Omit<ServiceListProps, 'services'> & { service: ServiceDto }) {
  const action =
    'inline-flex h-8 items-center rounded-md px-1.5 text-sm font-medium transition-colors';
  return (
    <div className="-mr-1.5 flex items-center justify-end gap-2">
      <button
        type="button"
        onClick={() => onEdit(service)}
        className={cn(action, 'text-brand-700 hover:text-brand-800')}
      >
        Edit<span className="sr-only"> {service.name}</span>
      </button>
      <button
        type="button"
        onClick={() => onDelete(service)}
        className={cn(action, 'text-stone-500 hover:text-red-700')}
      >
        Delete<span className="sr-only"> {service.name}</span>
      </button>
    </div>
  );
}

const HEAD =
  'px-4 py-3 text-left text-xs font-medium tracking-wide whitespace-nowrap text-stone-500 uppercase';

/** Services as a table in a panel from `md` up and as separate cards below it. */
export function ServiceList({ services, onEdit, onDelete }: ServiceListProps) {
  const { business } = useAuthenticatedSession();
  const price = (service: ServiceDto) => formatMoney(service.price, business.currency);

  return (
    <>
      <Card className="hidden overflow-hidden md:block">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-surface-muted">
              <tr>
                <th scope="col" className={cn(HEAD, 'pl-5')}>
                  Service
                </th>
                <th scope="col" className={HEAD}>
                  Unit
                </th>
                <th scope="col" className={cn(HEAD, 'text-right')}>
                  Price
                </th>
                <th scope="col" className={HEAD}>
                  Status
                </th>
                <th scope="col" className={cn(HEAD, 'pr-5 text-right')}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {services.map((service) => (
                <tr key={service.id} className="transition-colors hover:bg-stone-50">
                  <td className="max-w-md py-3 pr-4 pl-5">
                    <button
                      type="button"
                      onClick={() => onEdit(service)}
                      className="rounded-sm text-left font-medium text-stone-900 hover:text-brand-700"
                    >
                      {service.name}
                    </button>
                    {service.description && (
                      <p className="mt-0.5 line-clamp-1 text-xs text-stone-500">
                        {service.description}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-stone-600">
                    {service.unit ?? <span className="text-stone-400">—</span>}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold whitespace-nowrap text-stone-900 tabular-nums">
                    {price(service)}
                  </td>
                  <td className="px-4 py-3">
                    <ActiveSwitch service={service} />
                  </td>
                  <td className="py-2 pr-5 pl-4">
                    <ServiceActions service={service} onEdit={onEdit} onDelete={onDelete} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <ul className="space-y-3 md:hidden">
        {services.map((service) => (
          <li key={service.id} className="rounded-xl border border-stone-200 bg-surface p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <button
                  type="button"
                  onClick={() => onEdit(service)}
                  className="rounded-sm text-left font-medium text-stone-900"
                >
                  {service.name}
                </button>
                {service.description && (
                  <p className="mt-0.5 line-clamp-2 text-sm text-stone-500">
                    {service.description}
                  </p>
                )}
              </div>
              <div className="shrink-0 text-right">
                <p className="font-semibold text-stone-900 tabular-nums">{price(service)}</p>
                {service.unit && <p className="text-xs text-stone-500">per {service.unit}</p>}
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between gap-3 border-t border-stone-100 pt-3">
              <ActiveSwitch service={service} />
              <ServiceActions service={service} onEdit={onEdit} onDelete={onDelete} />
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}

export function ServiceListSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <Card role="status" aria-label="Loading services" className="divide-y divide-stone-100">
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} className="flex items-center gap-6 px-4 py-3.5 md:px-5">
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-4 w-40 max-w-full" />
            <Skeleton className="h-3 w-64 max-w-full" />
          </div>
          <Skeleton className="hidden h-4 w-16 md:block" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="hidden h-5 w-16 rounded-full md:block" />
        </div>
      ))}
    </Card>
  );
}

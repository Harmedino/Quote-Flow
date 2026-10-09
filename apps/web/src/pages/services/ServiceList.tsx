import type { ServiceDto } from '@quoteflow/shared';
import { Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
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
        className="group inline-flex items-center gap-2 rounded-full text-sm font-medium text-zinc-700 disabled:opacity-70"
      >
        <span
          aria-hidden="true"
          className={cn(
            'relative inline-flex h-5 w-9 shrink-0 rounded-full transition-colors',
            active ? 'bg-brand-600' : 'bg-zinc-300 group-hover:bg-zinc-400',
          )}
        >
          <span
            className={cn(
              'absolute top-0.5 left-0.5 size-4 rounded-full bg-white shadow-sm transition-transform',
              active && 'translate-x-4',
            )}
          />
        </span>
        <span className={active ? 'text-zinc-900' : 'text-zinc-500'}>
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

function ServiceActions({
  service,
  onEdit,
  onDelete,
}: Omit<ServiceListProps, 'services'> & { service: ServiceDto }) {
  return (
    <div className="flex items-center justify-end gap-1">
      <Button variant="ghost" size="icon" onClick={() => onEdit(service)} title="Edit">
        <Pencil aria-hidden="true" />
        <span className="sr-only">Edit {service.name}</span>
      </Button>
      <Button variant="ghost" size="icon" onClick={() => onDelete(service)} title="Delete">
        <Trash2 aria-hidden="true" />
        <span className="sr-only">Delete {service.name}</span>
      </Button>
    </div>
  );
}

/** Services as a table from `md` up and as stacked cards below it. */
export function ServiceList({ services, onEdit, onDelete }: ServiceListProps) {
  const { business } = useAuthenticatedSession();
  const price = (service: ServiceDto) => formatMoney(service.price, business.currency);

  return (
    <>
      <table className="hidden w-full text-left text-sm md:table">
        <thead className="border-b border-zinc-200 bg-zinc-50/80 text-xs font-medium tracking-wide text-zinc-500 uppercase">
          <tr>
            <th scope="col" className="px-6 py-3 font-medium">
              Service
            </th>
            <th scope="col" className="px-4 py-3 font-medium">
              Unit
            </th>
            <th scope="col" className="px-4 py-3 text-right font-medium">
              Price
            </th>
            <th scope="col" className="px-4 py-3 font-medium">
              Status
            </th>
            <th scope="col" className="px-6 py-3">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {services.map((service) => (
            <tr key={service.id} className="transition-colors hover:bg-zinc-50">
              <td className="max-w-md px-6 py-3.5">
                <button
                  type="button"
                  onClick={() => onEdit(service)}
                  className="text-left font-medium text-zinc-950 hover:text-brand-700"
                >
                  {service.name}
                </button>
                {service.description && (
                  <p className="mt-0.5 line-clamp-1 text-zinc-500">{service.description}</p>
                )}
              </td>
              <td className="px-4 py-3.5 whitespace-nowrap text-zinc-600">
                {service.unit ?? <span className="text-zinc-400">—</span>}
              </td>
              <td className="px-4 py-3.5 text-right font-medium whitespace-nowrap text-zinc-950 tabular-nums">
                {price(service)}
              </td>
              <td className="px-4 py-3.5">
                <ActiveSwitch service={service} />
              </td>
              <td className="px-6 py-2">
                <ServiceActions service={service} onEdit={onEdit} onDelete={onDelete} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <ul className="divide-y divide-zinc-100 md:hidden">
        {services.map((service) => (
          <li key={service.id} className="px-4 py-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <button
                  type="button"
                  onClick={() => onEdit(service)}
                  className="text-left font-medium text-zinc-950"
                >
                  {service.name}
                </button>
                {service.description && (
                  <p className="mt-0.5 line-clamp-2 text-sm text-zinc-500">{service.description}</p>
                )}
              </div>
              <div className="shrink-0 text-right">
                <p className="font-medium text-zinc-950 tabular-nums">{price(service)}</p>
                {service.unit && <p className="text-xs text-zinc-500">per {service.unit}</p>}
              </div>
            </div>
            <div className="mt-2 flex items-center justify-between gap-3">
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
    <div role="status" aria-label="Loading services" className="divide-y divide-zinc-100">
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} className="flex items-center gap-6 px-4 py-4 sm:px-6">
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-64 max-w-full" />
          </div>
          <Skeleton className="hidden h-4 w-16 md:block" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="hidden h-5 w-16 rounded-full md:block" />
        </div>
      ))}
    </div>
  );
}

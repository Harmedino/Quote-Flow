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
        className="group inline-flex items-center gap-2 rounded-md text-[13.5px] font-semibold disabled:opacity-70"
      >
        {/* The word beside it says the state too, so colour is never the only signal. */}
        <span
          aria-hidden="true"
          className={cn(
            'relative inline-flex h-5 w-9 shrink-0 rounded-[6px] transition-colors',
            active
              ? 'bg-primary'
              : 'bg-surface-muted shadow-[inset_0_0_0_1.5px_var(--color-edge)] group-hover:bg-canvas-deep',
          )}
        >
          <span
            className={cn(
              'absolute top-[3px] left-[3px] size-3.5 rounded-[4px] transition-transform',
              active ? 'translate-x-4 bg-on-primary' : 'bg-edge',
            )}
          />
        </span>
        <span className={active ? 'text-ink' : 'text-muted'}>{active ? 'Active' : 'Inactive'}</span>
      </button>
      {update.isError && (
        <p role="alert" className="text-xs text-danger">
          {getErrorMessage(update.error)}
        </p>
      )}
    </div>
  );
}

/** Quiet text actions; each names its service for assistive technology. */
function ServiceActions({
  service,
  onEdit,
  onDelete,
}: Omit<ServiceListProps, 'services'> & { service: ServiceDto }) {
  const action =
    'inline-flex h-8 items-center rounded-md px-1.5 text-[13.5px] font-[650] transition-colors';
  return (
    <div className="-mr-1.5 flex items-center justify-end gap-2">
      <button
        type="button"
        onClick={() => onEdit(service)}
        className={cn(action, 'text-primary-ink hover:underline')}
      >
        Edit<span className="sr-only"> {service.name}</span>
      </button>
      <button
        type="button"
        onClick={() => onDelete(service)}
        className={cn(action, 'text-muted hover:text-danger')}
      >
        Delete<span className="sr-only"> {service.name}</span>
      </button>
    </div>
  );
}

const HEAD =
  'border-y border-line px-3 py-2 text-left label-mono font-medium whitespace-nowrap text-muted';
const CELL = 'border-b border-line px-3 py-2.5';
const NONE = <span className="text-muted">—</span>;

/** Services as a table in a panel from `md` up and as rows in a panel below it. */
export function ServiceList({ services, onEdit, onDelete }: ServiceListProps) {
  const { business } = useAuthenticatedSession();
  const price = (service: ServiceDto) => formatMoney(service.price, business.currency);

  return (
    <Card className="overflow-hidden">
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full text-sm">
          <thead className="bg-surface-muted">
            <tr>
              <th scope="col" className={cn(HEAD, 'pl-6')}>
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
              <th scope="col" className={cn(HEAD, 'pr-6 text-right')}>
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="[&>tr:last-child>td]:border-b-0">
            {services.map((service) => (
              <tr key={service.id} className="transition-colors hover:bg-surface-muted">
                <td className={cn(CELL, 'max-w-md pl-6')}>
                  <button
                    type="button"
                    onClick={() => onEdit(service)}
                    className="rounded-sm text-left font-[650] text-ink hover:text-primary-ink"
                  >
                    {service.name}
                  </button>
                  {service.description && (
                    <p className="mt-0.5 line-clamp-1 text-[12.5px] text-muted">
                      {service.description}
                    </p>
                  )}
                </td>
                <td className={cn(CELL, 'whitespace-nowrap text-ink-2')}>{service.unit ?? NONE}</td>
                <td className={cn(CELL, 'text-right')}>
                  <span className="money text-[14px] text-ink">{price(service)}</span>
                </td>
                <td className={CELL}>
                  <ActiveSwitch service={service} />
                </td>
                <td className={cn(CELL, 'py-2 pr-6')}>
                  <ServiceActions service={service} onEdit={onEdit} onDelete={onDelete} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="divide-y divide-line md:hidden">
        {services.map((service) => (
          <li key={service.id} className="px-3.5 pt-3 pb-2">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <button
                  type="button"
                  onClick={() => onEdit(service)}
                  className="rounded-sm text-left text-[14.5px] font-semibold text-ink"
                >
                  {service.name}
                </button>
                {service.description && (
                  <p className="mt-0.5 line-clamp-2 text-[12.5px] text-muted">
                    {service.description}
                  </p>
                )}
              </div>
              <div className="shrink-0 text-right">
                <p className="money text-[13.5px] text-ink">{price(service)}</p>
                {service.unit && (
                  <p className="mt-0.5 text-[12px] text-muted">per {service.unit}</p>
                )}
              </div>
            </div>
            <div className="mt-2 flex items-center justify-between gap-3">
              <ActiveSwitch service={service} />
              <ServiceActions service={service} onEdit={onEdit} onDelete={onDelete} />
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}

export function ServiceListSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <Card role="status" aria-label="Loading services" className="divide-y divide-line">
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} className="flex items-center gap-6 px-3.5 py-3.5 md:px-6">
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-4 w-40 max-w-full" />
            <Skeleton className="h-3 w-64 max-w-full" />
          </div>
          <Skeleton className="hidden h-4 w-16 md:block" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="hidden h-5 w-16 md:block" />
        </div>
      ))}
    </Card>
  );
}

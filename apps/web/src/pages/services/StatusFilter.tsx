import {
  SERVICE_STATUS_FILTERS,
  type ServiceStatusFilter,
} from '@/features/services/service-list-params';
import { cn } from '@/lib/cn';

const LABELS: Record<ServiceStatusFilter, string> = {
  all: 'All',
  active: 'Active',
  inactive: 'Inactive',
};

/** A segmented control for the services list's status filter. */
export function StatusFilter({
  value,
  onChange,
}: {
  value: ServiceStatusFilter;
  onChange: (status: ServiceStatusFilter) => void;
}) {
  return (
    <div
      role="group"
      aria-label="Filter by status"
      className="inline-flex shrink-0 self-start rounded-lg bg-zinc-100 p-1 sm:self-auto"
    >
      {SERVICE_STATUS_FILTERS.map((status) => (
        <button
          key={status}
          type="button"
          aria-pressed={value === status}
          onClick={() => onChange(status)}
          className={cn(
            'h-8 rounded-md px-3 text-sm font-medium transition-colors',
            value === status
              ? 'bg-white text-zinc-950 shadow-xs ring-1 ring-zinc-200'
              : 'text-zinc-600 hover:text-zinc-950',
          )}
        >
          {LABELS[status]}
        </button>
      ))}
    </div>
  );
}

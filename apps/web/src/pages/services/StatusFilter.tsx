import { TAB_LIST_CLASSES, TAB_SCROLLER_CLASSES, tabClasses } from '@/components/ui/tab-styles';
import {
  SERVICE_STATUS_FILTERS,
  type ServiceStatusFilter,
} from '@/features/services/service-list-params';

const LABELS: Record<ServiceStatusFilter, string> = {
  all: 'All',
  active: 'Active',
  inactive: 'Inactive',
};

/** The services list's status filter, as the same underlined tabs as the quote and invoice lists. */
export function StatusFilter({
  value,
  onChange,
}: {
  value: ServiceStatusFilter;
  onChange: (status: ServiceStatusFilter) => void;
}) {
  return (
    <div role="group" aria-label="Filter services by status" className={TAB_SCROLLER_CLASSES}>
      <div className={TAB_LIST_CLASSES}>
        {SERVICE_STATUS_FILTERS.map((status) => (
          <button
            key={status}
            type="button"
            aria-pressed={value === status}
            onClick={() => onChange(status)}
            className={tabClasses(value === status)}
          >
            {LABELS[status]}
          </button>
        ))}
      </div>
    </div>
  );
}

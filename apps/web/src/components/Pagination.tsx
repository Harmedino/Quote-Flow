import type { PaginationMeta } from '@quoteflow/shared';
import { Button } from '@/components/ui/Button';

export interface PaginationProps {
  meta: PaginationMeta;
  onPageChange: (page: number) => void;
  /** Noun for the summary, e.g. "quotes". */
  label?: string;
}

/** Below a list: the range shown and, when there is more than one page, Previous/Next. */
export function Pagination({ meta, onPageChange, label = 'results' }: PaginationProps) {
  if (meta.total === 0) return null;
  const first = (meta.page - 1) * meta.pageSize + 1;
  const last = Math.min(meta.page * meta.pageSize, meta.total);

  return (
    <nav
      aria-label="Pagination"
      className="mt-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 text-sm text-muted"
    >
      <p>
        Showing{' '}
        <span className="font-mono text-[13px] font-medium text-ink-2">
          {first}–{last}
        </span>{' '}
        of <span className="font-mono text-[13px] font-medium text-ink-2">{meta.total}</span>{' '}
        {label}
      </p>
      {meta.totalPages > 1 && (
        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            disabled={meta.page <= 1}
            onClick={() => onPageChange(meta.page - 1)}
          >
            Previous
          </Button>
          <Button
            variant="secondary"
            size="sm"
            disabled={meta.page >= meta.totalPages}
            onClick={() => onPageChange(meta.page + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </nav>
  );
}

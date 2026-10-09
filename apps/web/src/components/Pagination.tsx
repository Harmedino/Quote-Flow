import type { PaginationMeta } from '@quoteflow/shared';
import { Button } from '@/components/ui/Button';

export interface PaginationProps {
  meta: PaginationMeta;
  onPageChange: (page: number) => void;
  /** Noun for the summary, e.g. "quotes". */
  label?: string;
}

/** The footer of a list card: the range shown and, when there is more than one page, Previous/Next. */
export function Pagination({ meta, onPageChange, label = 'results' }: PaginationProps) {
  if (meta.total === 0) return null;
  const first = (meta.page - 1) * meta.pageSize + 1;
  const last = Math.min(meta.page * meta.pageSize, meta.total);

  return (
    <nav
      aria-label="Pagination"
      className="flex items-center justify-between gap-4 border-t border-zinc-200 px-4 py-3 text-sm text-zinc-600 sm:px-6"
    >
      <p>
        Showing <span className="font-medium text-zinc-900">{first}</span>–
        <span className="font-medium text-zinc-900">{last}</span> of{' '}
        <span className="font-medium text-zinc-900">{meta.total}</span> {label}
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

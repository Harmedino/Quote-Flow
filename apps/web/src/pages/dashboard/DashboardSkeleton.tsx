import { Skeleton } from '@/components/ui/Skeleton';

function ListSkeleton({ rows }: { rows: number }) {
  return (
    <div>
      <Skeleton className="h-6 w-40" />
      <div className="mt-3 divide-y divide-stone-100 rounded-2xl border border-stone-200 bg-surface">
        {Array.from({ length: rows }, (_, index) => (
          <div key={index} className="flex items-center gap-3 px-4 py-3">
            <Skeleton className="size-8 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-36 max-w-full" />
              <Skeleton className="h-3 w-24" />
            </div>
            <div className="flex flex-col items-end gap-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-14 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Shaped like the dashboard: figures, the chart, then the two columns. */
export function DashboardSkeleton() {
  return (
    <div role="status" aria-label="Loading your dashboard" className="space-y-6">
      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-stone-200 bg-stone-200 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="bg-surface p-4 sm:p-5">
            <Skeleton className="h-3.5 w-24" />
            <Skeleton className="mt-2.5 h-7 w-20" />
            <Skeleton className="mt-2 h-3 w-28 max-w-full" />
          </div>
        ))}
      </div>
      <div className="rounded-2xl border border-stone-200 bg-surface p-4 sm:p-5">
        <Skeleton className="h-4 w-52 max-w-full" />
        <Skeleton className="mt-2 h-7 w-36" />
        <Skeleton className="mt-6 h-44 rounded-xl sm:h-52" />
      </div>
      <div className="grid grid-cols-1 gap-8 xl:grid-cols-[minmax(0,1fr)_340px]">
        <ListSkeleton rows={4} />
        <Skeleton className="h-80 rounded-xl" />
      </div>
    </div>
  );
}

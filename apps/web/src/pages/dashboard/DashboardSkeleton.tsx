import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';

function RowsSkeleton({ rows }: { rows: number }) {
  return (
    <div className="divide-y divide-line">
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} className="flex items-center gap-3 px-4 py-3 lg:px-6">
          <Skeleton className="size-8" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-36 max-w-full" />
            <Skeleton className="h-3 w-24" />
          </div>
          <Skeleton className="h-4 w-20" />
        </div>
      ))}
    </div>
  );
}

function PanelSkeleton({ rows, className }: { rows: number; className?: string }) {
  return (
    <Card className={className}>
      <div className="px-4 pt-4 pb-2 lg:px-6">
        <Skeleton className="h-5 w-40" />
      </div>
      <RowsSkeleton rows={rows} />
    </Card>
  );
}

/** Shaped like the dashboard: the figures strip, the chart beside the jobs, then the lists. */
export function DashboardSkeleton() {
  return (
    <div role="status" aria-label="Loading your dashboard" className="space-y-5">
      <div className="grid grid-cols-3 gap-px overflow-hidden rounded-xl bg-line shadow-(--shadow-card) lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div
            key={index}
            className="bg-surface px-3.5 pt-4 pb-4 first:col-span-3 sm:px-5.5 lg:first:col-span-1"
          >
            <Skeleton className="h-3 w-24 max-w-full" />
            <Skeleton className="mt-3 h-7 w-28 max-w-full" />
            <Skeleton className="mt-3 h-3 w-32 max-w-full" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        <Card className="p-4 lg:col-span-8 lg:p-6">
          <Skeleton className="h-4 w-56 max-w-full" />
          <Skeleton className="mt-3 h-7 w-40" />
          <Skeleton className="mt-5 h-32 lg:h-36" />
        </Card>
        <PanelSkeleton rows={3} className="lg:col-span-4" />
        <PanelSkeleton rows={4} className="lg:col-span-8" />
        <PanelSkeleton rows={3} className="lg:col-span-4" />
      </div>
    </div>
  );
}

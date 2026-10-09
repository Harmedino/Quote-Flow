import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';

function TileSkeleton() {
  return (
    <Card className="p-4 sm:p-5">
      <Skeleton className="h-4 w-20" />
      <Skeleton className="mt-3 h-7 w-24" />
      <Skeleton className="mt-2 h-3 w-16" />
    </Card>
  );
}

function ListSkeleton() {
  return (
    <Card>
      <div className="border-b border-zinc-200 px-5 py-4 sm:px-6">
        <Skeleton className="h-5 w-32" />
      </div>
      <div className="divide-y divide-zinc-100">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="flex items-center justify-between gap-4 px-5 py-3.5 sm:px-6">
            <div className="space-y-2">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="h-4 w-16" />
          </div>
        ))}
      </div>
    </Card>
  );
}

export function DashboardSkeleton() {
  return (
    <div role="status" aria-label="Loading your dashboard" className="space-y-8">
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          <TileSkeleton />
          <TileSkeleton />
          <TileSkeleton />
        </div>
        <div className="grid gap-3 sm:grid-cols-3 sm:gap-4">
          <TileSkeleton />
          <TileSkeleton />
          <TileSkeleton />
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <ListSkeleton />
        <ListSkeleton />
      </div>
    </div>
  );
}

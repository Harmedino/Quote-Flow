import { Skeleton } from '@/components/ui/Skeleton';

export function EditorSkeleton() {
  return (
    <div
      role="status"
      aria-label="Loading"
      className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_18rem]"
    >
      <div className="space-y-6">
        {[24, 48, 20].map((height, index) => (
          <div key={index} className="rounded-xl border border-zinc-200 bg-white p-6">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="mt-5 w-full" />
            <div style={{ height: `${height * 0.25}rem` }} className="mt-4">
              <Skeleton className="h-full w-full" />
            </div>
          </div>
        ))}
      </div>
      <div className="hidden h-80 rounded-xl border border-zinc-200 bg-white p-6 xl:block">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="mt-6 h-4 w-full" />
        <Skeleton className="mt-3 h-4 w-full" />
        <Skeleton className="mt-8 h-8 w-full" />
      </div>
    </div>
  );
}

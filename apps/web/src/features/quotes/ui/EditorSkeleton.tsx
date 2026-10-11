import { Skeleton } from '@/components/ui/Skeleton';

/** Shaped like the builder: numbered sections and the side panel. */
export function EditorSkeleton() {
  return (
    <div
      role="status"
      aria-label="Loading"
      className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_21rem]"
    >
      <div className="space-y-6">
        {[24, 48, 20].map((height, index) => (
          <div key={index} className="rounded-xl bg-surface p-6 shadow-(--shadow-card)">
            <div className="flex items-center gap-3">
              <Skeleton className="h-7 w-10 rounded-md" />
              <Skeleton className="h-5 w-32" />
            </div>
            <Skeleton className="mt-5 h-10 w-full" />
            <div style={{ height: `${height * 0.25}rem` }} className="mt-4">
              <Skeleton className="h-full w-full" />
            </div>
          </div>
        ))}
      </div>
      <div className="hidden h-96 rounded-xl bg-surface p-6 shadow-(--shadow-card) xl:block">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="mt-4 h-8 w-40" />
        <Skeleton className="mt-6 h-4 w-full" />
        <Skeleton className="mt-3 h-4 w-full" />
        <Skeleton className="mt-8 h-11 w-full" />
        <Skeleton className="mt-3 h-11 w-full" />
      </div>
    </div>
  );
}

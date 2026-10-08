import { cn } from '@/lib/cn';

/** A loading placeholder block; size it with `className` (e.g. `h-4 w-32`). */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'animate-pulse rounded-md bg-zinc-200/70 motion-reduce:animate-none',
        className,
      )}
    />
  );
}

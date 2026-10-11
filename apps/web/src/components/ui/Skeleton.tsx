import { cn } from '@/lib/cn';

/** A loading placeholder block; size it with `className` (e.g. `h-4 w-32`). */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div aria-hidden="true" className={cn('animate-skeleton rounded-lg bg-line/80', className)} />
  );
}

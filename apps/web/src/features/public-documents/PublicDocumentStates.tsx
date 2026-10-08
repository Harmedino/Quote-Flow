import { CloudOff, Link2Off, RotateCw } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { getErrorMessage } from '@/lib/api-client';

const PANEL =
  'animate-fade-in rounded-2xl bg-white px-6 py-14 text-center shadow-sm ring-1 ring-zinc-900/5 sm:px-12 sm:py-20';

/** Shown for unknown, withdrawn or mistyped links. Deliberately says nothing about why. */
export function PublicLinkUnavailable({ kind }: { kind: 'quote' | 'invoice' }) {
  return (
    <div className={PANEL}>
      <title>Link not available</title>
      <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-zinc-100 text-zinc-500">
        <Link2Off aria-hidden="true" className="size-6" />
      </span>
      <h1 className="mt-5 text-lg font-semibold text-zinc-950">This link isn’t available</h1>
      <p className="mx-auto mt-2 max-w-sm text-sm/6 text-pretty text-zinc-600">
        The {kind} may have been withdrawn, or the link may be incomplete. Please check the link you
        received, or contact the business that sent it.
      </p>
    </div>
  );
}

export function PublicDocumentError({
  error,
  onRetry,
  retrying,
}: {
  error: unknown;
  onRetry: () => void;
  retrying: boolean;
}) {
  return (
    <div className={PANEL}>
      <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-zinc-100 text-zinc-500">
        <CloudOff aria-hidden="true" className="size-6" />
      </span>
      <h1 className="mt-5 text-lg font-semibold text-zinc-950">We couldn’t load this page</h1>
      <p className="mx-auto mt-2 max-w-sm text-sm/6 text-pretty text-zinc-600">
        {getErrorMessage(error)}
      </p>
      <Button variant="secondary" className="mt-6" onClick={onRetry} loading={retrying}>
        <RotateCw aria-hidden="true" />
        Try again
      </Button>
    </div>
  );
}

/** Mirrors the document's layout so nothing jumps when it arrives. */
export function PublicDocumentSkeleton() {
  return (
    <div role="status" aria-label="Loading" className="space-y-5">
      <div className="flex items-end justify-between">
        <div className="space-y-2">
          <Skeleton className="h-3.5 w-20" />
          <Skeleton className="h-6 w-48" />
        </div>
        <Skeleton className="h-10 w-20 rounded-lg sm:w-36" />
      </div>
      <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-zinc-900/5">
        <div className="h-1.5 bg-zinc-200" />
        <div className="space-y-10 px-5 py-7 sm:px-10 sm:py-10">
          <div className="flex flex-col gap-6 sm:flex-row sm:justify-between">
            <div className="flex gap-4">
              <Skeleton className="size-12 rounded-xl sm:size-14" />
              <div className="space-y-2 pt-1">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-3.5 w-32" />
                <Skeleton className="h-3.5 w-28" />
              </div>
            </div>
            <div className="space-y-2 sm:items-end">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-7 w-28" />
            </div>
          </div>
          <Skeleton className="h-28 w-full rounded-xl" />
          <div className="space-y-4">
            {[0, 1, 2].map((row) => (
              <div key={row} className="flex justify-between gap-6">
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-3.5 w-1/3" />
                </div>
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </div>
          <div className="flex justify-end">
            <Skeleton className="h-24 w-full rounded-xl sm:w-80" />
          </div>
        </div>
      </div>
    </div>
  );
}

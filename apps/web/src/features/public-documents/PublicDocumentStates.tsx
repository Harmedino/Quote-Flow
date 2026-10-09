import { CloudOff, Link2Off, type LucideIcon, RotateCw } from 'lucide-react';
import type { ReactNode } from 'react';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { getErrorMessage } from '@/lib/api-client';

/** The card that sits over the layout's ink band when there is no document to show. */
function StateCard({
  icon: Icon,
  title,
  children,
}: {
  icon: LucideIcon;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="animate-fade-in-up rounded-3xl border border-stone-200 bg-surface px-6 py-14 text-center shadow-[0_20px_50px_-20px_rgb(12_26_20/0.3)] sm:px-12 sm:py-16 lg:mx-auto lg:max-w-3xl">
      <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-stone-100 text-stone-500">
        <Icon aria-hidden="true" className="size-6" />
      </span>
      <h1 className="mt-5 text-2xl font-semibold text-stone-900">{title}</h1>
      {children}
    </div>
  );
}

/** Shown for unknown, withdrawn or mistyped links. Deliberately says nothing about why. */
export function PublicLinkUnavailable({ kind }: { kind: 'quote' | 'invoice' }) {
  return (
    <StateCard icon={Link2Off} title="This link isn’t available">
      <title>Link not available</title>
      <p className="mx-auto mt-2 max-w-sm text-sm/6 text-pretty text-stone-600">
        The {kind} may have been withdrawn, or the link may be incomplete. Please check the link you
        received, or contact the business that sent it.
      </p>
    </StateCard>
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
    <StateCard icon={CloudOff} title="We couldn’t load this page">
      <p className="mx-auto mt-2 max-w-sm text-sm/6 text-pretty text-stone-600">
        {getErrorMessage(error)}
      </p>
      <Button variant="secondary" size="lg" className="mt-6" onClick={onRetry} loading={retrying}>
        <RotateCw aria-hidden="true" />
        Try again
      </Button>
    </StateCard>
  );
}

/** Mirrors the header card, the document and the summary so nothing jumps when they arrive. */
export function PublicDocumentSkeleton() {
  return (
    <div role="status" aria-label="Loading" className="space-y-5">
      <div className="rounded-3xl border border-stone-200 bg-surface p-5 sm:p-7">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
          <Skeleton className="size-12 rounded-xl sm:size-14" />
          <div className="flex-1 space-y-2.5">
            <Skeleton className="h-3.5 w-20" />
            <Skeleton className="h-7 w-56" />
            <Skeleton className="h-4 w-64 max-w-full" />
            <div className="flex gap-2 pt-1.5">
              <Skeleton className="h-9 w-40 rounded-full" />
              <Skeleton className="h-9 w-28 rounded-full" />
            </div>
          </div>
          <Skeleton className="h-11 w-full rounded-lg sm:w-40 lg:hidden" />
        </div>
      </div>
      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start lg:gap-6">
        <DocumentSkeleton />
        <div className="hidden space-y-5 rounded-3xl border border-stone-200 bg-surface p-6 lg:block">
          <div className="space-y-2">
            <Skeleton className="h-3.5 w-16" />
            <Skeleton className="h-9 w-48" />
            <Skeleton className="h-3.5 w-32" />
          </div>
          <Skeleton className="h-12 w-full rounded-lg" />
          <Skeleton className="h-11 w-full rounded-lg" />
        </div>
      </div>
    </div>
  );
}

function DocumentSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-stone-200 bg-surface">
      <div className="h-1.5 bg-stone-200" />
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
        <Skeleton className="h-28 w-full rounded-2xl" />
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
  );
}

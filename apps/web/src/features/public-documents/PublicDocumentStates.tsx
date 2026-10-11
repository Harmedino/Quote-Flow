import { RotateCw } from 'lucide-react';
import { type ErrorTicketProps, ErrorTicket } from '@/app/RouteErrorBoundary';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { Ticket, TicketPart } from '@/components/ui/Ticket';
import { getErrorMessage, isApiError } from '@/lib/api-client';
import { DocumentBand, DocumentColumns } from './DocumentBand';

/**
 * An error ticket over a plain navy band, like the 404's, when there is no document (and so no
 * business) to show.
 */
function StateTicket(props: ErrorTicketProps) {
  return (
    <>
      <DocumentBand tone="navy" />
      <DocumentColumns>
        <ErrorTicket {...props} />
      </DocumentColumns>
    </>
  );
}

/** Shown for unknown, withdrawn or mistyped links. Deliberately says nothing about why. */
export function PublicLinkUnavailable({ kind }: { kind: 'quote' | 'invoice' }) {
  return (
    <>
      <title>Link not available</title>
      <StateTicket
        label="Link"
        number="404"
        stamp="Void"
        title="This link isn’t available"
        description={`The ${kind} may have been withdrawn, or the link may be incomplete. Please check the link you received, or contact the business that sent it.`}
      />
    </>
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
  const offline = isApiError(error) && error.code === 'NETWORK_ERROR';
  return (
    <StateTicket
      label={offline ? 'Connection' : 'Page'}
      number={offline ? 'Offline' : 'Error'}
      title="We couldn’t load this page"
      description={getErrorMessage(error)}
      actions={
        <Button size="lg" onClick={onRetry} loading={retrying}>
          <RotateCw aria-hidden="true" />
          Try again
        </Button>
      }
    />
  );
}

/** The band, the ticket and the summary in outline, so nothing jumps when they arrive. */
export function PublicDocumentSkeleton() {
  return (
    <div role="status" aria-label="Loading">
      <DocumentBand tone="loading">
        <div className="flex justify-between">
          <Skeleton className="h-3 w-40" />
          <Skeleton className="h-3 w-20" />
        </div>
        <div className="mt-4.5 flex items-center gap-3.5 lg:mt-6">
          <Skeleton className="size-13 rounded-xl lg:size-16" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-6 w-56 max-w-full" />
            <Skeleton className="h-4 w-72 max-w-full" />
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2 lg:hidden">
          <Skeleton className="h-10.5 rounded-[9px]" />
          <Skeleton className="h-10.5 rounded-[9px]" />
        </div>
      </DocumentBand>
      <DocumentColumns aside={<SummarySkeleton />}>
        <Ticket lift="high">
          <TicketPart className="space-y-3 p-5 sm:px-8 sm:py-6">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-7 w-44" />
            <div className="flex gap-12 pt-2">
              <Skeleton className="h-9 w-28" />
              <Skeleton className="h-9 w-28" />
            </div>
          </TicketPart>
          <TicketPart className="space-y-2.5 p-5 sm:px-8 sm:py-6">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-56" />
          </TicketPart>
          <TicketPart className="space-y-5 p-5 sm:px-8 sm:py-6">
            {[0, 1].map((row) => (
              <div key={row} className="flex justify-between gap-6">
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-3.5 w-1/3" />
                </div>
                <Skeleton className="h-4 w-24" />
              </div>
            ))}
            <Skeleton className="h-16 w-full rounded-[10px]" />
          </TicketPart>
        </Ticket>
      </DocumentColumns>
    </div>
  );
}

function SummarySkeleton() {
  return (
    <div className="hidden lg:block">
      <Ticket lift="high">
        <TicketPart className="space-y-3 p-6">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-40" />
        </TicketPart>
        <TicketPart className="space-y-2.5 p-5">
          <Skeleton className="h-13.5 w-full rounded-[10px]" />
          <Skeleton className="h-12 w-full rounded-[10px]" />
        </TicketPart>
      </Ticket>
    </div>
  );
}

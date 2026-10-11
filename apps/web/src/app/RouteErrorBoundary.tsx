import { RotateCw } from 'lucide-react';
import type { ReactNode } from 'react';
import { isRouteErrorResponse, useRouteError } from 'react-router';
import { DocumentTitle } from '@/components/DocumentTitle';
import { StandalonePage } from '@/components/layout/StandalonePage';
import { useInMarketingSite } from '@/components/marketing/marketing-site';
import { Button } from '@/components/ui/Button';
import { ButtonLink } from '@/components/ui/ButtonLink';
import { Stamp } from '@/components/ui/Stamp';
import type { ButtonStyleProps } from '@/components/ui/button-styles';
import { Ticket, TicketPart } from '@/components/ui/Ticket';
import { getErrorMessage, isApiError } from '@/lib/api-error';
import { paths } from './paths';

const DEFAULT_DESCRIPTION =
  'This page didn’t load properly. Reloading usually fixes it. If it keeps happening, please try again later.';

export interface ErrorTicketProps {
  /** The mono line on the stub, e.g. "Page". */
  label: string;
  /** Printed large on the stub, e.g. "404". */
  number: string;
  /** Stamped across the stub, e.g. "Not found". */
  stamp?: string;
  title: string;
  description: ReactNode;
  actions?: ReactNode;
}

/**
 * A page that couldn't be shown, as a job ticket: the stub carries the error like a ticket
 * number, the body says what happened and what to do next.
 */
export function ErrorTicket({
  label,
  number,
  stamp,
  title,
  description,
  actions,
}: ErrorTicketProps) {
  return (
    <Ticket lift="high" className="mx-auto w-full max-w-md animate-fade-in-up [--notch:10px]">
      <TicketPart tone="stub" className="px-6 pt-5 pb-6">
        <p className="label-mono text-ink-2">{label}</p>
        {/* The stamp goes under the number when the stub is too narrow for both. */}
        <div className="mt-2.5 flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
          <p className="text-[56px] leading-none font-[860] tracking-[-0.03em] font-stretch-125%">
            {number}
          </p>
          {stamp && (
            <Stamp tone="declined" className="mr-1">
              {stamp}
            </Stamp>
          )}
        </div>
      </TicketPart>
      <TicketPart className="p-6">
        <h1 className="text-[22px] leading-tight font-[800] text-balance font-stretch-115%">
          {title}
        </h1>
        <p className="mt-2 text-[14.5px] text-pretty text-ink-2">{description}</p>
        {actions && <div className="mt-6 grid gap-2.5">{actions}</div>}
      </TicketPart>
    </Ticket>
  );
}

/** The sizes of an error's two ways out: the main one, and a quieter one beside it. */
interface ErrorActionStyles {
  main: ButtonStyleProps;
  quiet: ButtonStyleProps;
}

/** What went wrong with the route, as a ticket, with a way back. */
function RouteErrorTicket({ main, quiet }: ErrorActionStyles) {
  const error = useRouteError();

  if (isRouteErrorResponse(error) && error.status === 404) {
    return (
      <>
        <DocumentTitle title="Page not found" />
        <ErrorTicket
          label="Page"
          number="404"
          stamp="Not found"
          title="Page not found"
          description="We couldn’t find what you were looking for. It may have been moved or deleted."
          actions={
            <ButtonLink to={paths.home} {...main}>
              Back to home
            </ButtonLink>
          }
        />
      </>
    );
  }

  const offline = isApiError(error) && error.code === 'NETWORK_ERROR';
  const title = offline ? 'Can’t reach QuoteFlow' : 'Something went wrong';
  return (
    <>
      <DocumentTitle title={title} />
      <ErrorTicket
        label={offline ? 'Connection' : 'Page'}
        number={offline ? 'Offline' : 'Error'}
        title={title}
        description={isApiError(error) ? getErrorMessage(error) : DEFAULT_DESCRIPTION}
        actions={
          <>
            <Button {...main} onClick={() => window.location.reload()}>
              <RotateCw aria-hidden="true" />
              Reload page
            </Button>
            <ButtonLink to={paths.home} {...quiet}>
              Back to home
            </ButtonLink>
          </>
        }
      />
    </>
  );
}

/**
 * Rendered in place of a route that failed to load or render, including a
 * page chunk that is no longer available after a deploy (a reload fixes it)
 * and an API failure, such as being offline while the session is checked.
 * It sits in the page's own layout, so the navigation around it stays usable.
 */
export function RouteErrorBoundary() {
  // The website's calls to action are larger, with an outlined second one.
  const onWebsite = useInMarketingSite();
  return (
    <div className="px-4 py-8 sm:py-12">
      <RouteErrorTicket
        main={onWebsite ? { size: 'lg' } : {}}
        quiet={onWebsite ? { variant: 'outline', size: 'lg' } : { variant: 'secondary' }}
      />
    </div>
  );
}

/**
 * The root route's boundary, for when a layout itself failed (e.g. its chunk didn't load): with
 * no layout around it, the page brings its own tape and logo, like the 404.
 */
export function RootErrorBoundary() {
  return (
    <StandalonePage>
      <RouteErrorTicket main={{ size: 'lg' }} quiet={{ variant: 'secondary', size: 'lg' }} />
    </StandalonePage>
  );
}

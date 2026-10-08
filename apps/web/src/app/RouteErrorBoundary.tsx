import { RotateCw } from 'lucide-react';
import { isRouteErrorResponse, useRouteError } from 'react-router';
import { StatusMessage } from '@/components/StatusMessage';
import { Button } from '@/components/ui/Button';
import { ButtonLink } from '@/components/ui/ButtonLink';
import { DocumentTitle } from '@/components/DocumentTitle';
import { paths } from './paths';

/**
 * Rendered in place of a route that failed to load or render, including a
 * page chunk that is no longer available after a deploy (a reload fixes it).
 */
export function RouteErrorBoundary() {
  const error = useRouteError();

  if (isRouteErrorResponse(error) && error.status === 404) {
    return (
      <>
        <DocumentTitle title="Page not found" />
        <StatusMessage
          eyebrow="404"
          title="Page not found"
          description="We couldn’t find what you were looking for. It may have been moved or deleted."
          actions={<ButtonLink to={paths.home}>Back to home</ButtonLink>}
        />
      </>
    );
  }

  return (
    <>
      <DocumentTitle title="Something went wrong" />
      <StatusMessage
        eyebrow="Unexpected error"
        title="Something went wrong"
        description="This page didn’t load properly. Reloading usually fixes it. If it keeps happening, please try again later."
        actions={
          <>
            <Button onClick={() => window.location.reload()}>
              <RotateCw aria-hidden="true" />
              Reload page
            </Button>
            <ButtonLink to={paths.home} variant="secondary">
              Back to home
            </ButtonLink>
          </>
        }
      />
    </>
  );
}

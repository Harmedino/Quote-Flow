import { RotateCw } from 'lucide-react';
import { isRouteErrorResponse, useRouteError } from 'react-router';
import { StatusMessage } from '@/components/StatusMessage';
import { Button } from '@/components/ui/Button';
import { ButtonLink } from '@/components/ui/ButtonLink';
import { DocumentTitle } from '@/components/DocumentTitle';
import { getErrorMessage, isApiError } from '@/lib/api-error';
import { paths } from './paths';

const DEFAULT_DESCRIPTION =
  'This page didn’t load properly. Reloading usually fixes it. If it keeps happening, please try again later.';

/**
 * Rendered in place of a route that failed to load or render, including a
 * page chunk that is no longer available after a deploy (a reload fixes it)
 * and an API failure, such as being offline while the session is checked.
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

  const offline = isApiError(error) && error.code === 'NETWORK_ERROR';
  const title = offline ? 'Can’t reach QuoteFlow' : 'Something went wrong';

  return (
    <>
      <DocumentTitle title={title} />
      <StatusMessage
        eyebrow={offline ? 'Connection problem' : 'Unexpected error'}
        title={title}
        description={isApiError(error) ? getErrorMessage(error) : DEFAULT_DESCRIPTION}
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

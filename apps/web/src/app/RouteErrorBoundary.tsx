import { CloudOff, RotateCw, SearchX, TriangleAlert } from 'lucide-react';
import { isRouteErrorResponse, useRouteError } from 'react-router';
import { DocumentTitle } from '@/components/DocumentTitle';
import { useInMarketingSite } from '@/components/marketing/marketing-site';
import { Button } from '@/components/ui/Button';
import { ButtonLink } from '@/components/ui/ButtonLink';
import { Card } from '@/components/ui/Card';
import { EmptyState, type EmptyStateProps } from '@/components/ui/EmptyState';
import { getErrorMessage, isApiError } from '@/lib/api-error';
import { paths } from './paths';

const DEFAULT_DESCRIPTION =
  'This page didn’t load properly. Reloading usually fixes it. If it keeps happening, please try again later.';

/** A card in the page's own layout, so the navigation around it stays usable. */
function ErrorCard(props: Omit<EmptyStateProps, 'titleAs' | 'variant'>) {
  return (
    <>
      <DocumentTitle title={props.title} />
      <Card className="mx-4 my-6 max-w-lg sm:mx-auto sm:my-12">
        <EmptyState titleAs="h1" {...props} />
      </Card>
    </>
  );
}

/**
 * Rendered in place of a route that failed to load or render, including a
 * page chunk that is no longer available after a deploy (a reload fixes it)
 * and an API failure, such as being offline while the session is checked.
 */
export function RouteErrorBoundary() {
  const error = useRouteError();
  // On the website, its own pills (ink, then an outline); in the app, its usual buttons.
  const onWebsite = useInMarketingSite();
  const main = onWebsite
    ? ({ variant: 'ink', shape: 'pill', size: 'lg' } as const)
    : ({ variant: 'primary' } as const);
  const quiet = onWebsite
    ? ({ variant: 'secondary', shape: 'pill', size: 'lg' } as const)
    : ({ variant: 'secondary' } as const);

  if (isRouteErrorResponse(error) && error.status === 404) {
    return (
      <ErrorCard
        icon={SearchX}
        title="Page not found"
        description="We couldn’t find what you were looking for. It may have been moved or deleted."
        action={
          <ButtonLink to={paths.home} {...main}>
            Back to home
          </ButtonLink>
        }
      />
    );
  }

  const offline = isApiError(error) && error.code === 'NETWORK_ERROR';
  return (
    <ErrorCard
      icon={offline ? CloudOff : TriangleAlert}
      title={offline ? 'Can’t reach QuoteFlow' : 'Something went wrong'}
      description={isApiError(error) ? getErrorMessage(error) : DEFAULT_DESCRIPTION}
      action={
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
  );
}

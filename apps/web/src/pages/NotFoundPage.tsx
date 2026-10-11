import { ArrowRight } from 'lucide-react';
import { ErrorTicket } from '@/app/RouteErrorBoundary';
import { paths } from '@/app/paths';
import { DocumentTitle } from '@/components/DocumentTitle';
import { StandalonePage } from '@/components/layout/StandalonePage';
import { ButtonLink } from '@/components/ui/ButtonLink';

export default function NotFoundPage() {
  return (
    <StandalonePage>
      <DocumentTitle title="Page not found" />
      <ErrorTicket
        label="Page"
        number="404"
        stamp="Not found"
        title="This page doesn’t exist."
        description="The link may be old or mistyped. If a business sent you a quote or invoice, ask them for the link again."
        actions={
          <>
            <ButtonLink to={paths.home} size="lg">
              Go to the homepage
              <ArrowRight aria-hidden="true" />
            </ButtonLink>
            <ButtonLink to={paths.dashboard} variant="secondary" size="lg">
              Open my dashboard
            </ButtonLink>
          </>
        }
      />
    </StandalonePage>
  );
}

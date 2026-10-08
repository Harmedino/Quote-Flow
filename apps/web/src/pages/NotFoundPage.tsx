import { Link } from 'react-router';
import { paths } from '@/app/paths';
import { DocumentTitle } from '@/components/DocumentTitle';
import { MAIN_CONTENT_ID } from '@/components/layout/SkipLink';
import { StatusMessage } from '@/components/StatusMessage';
import { ButtonLink } from '@/components/ui/ButtonLink';
import { Logo } from '@/components/ui/Logo';

export default function NotFoundPage() {
  return (
    <div className="flex min-h-dvh flex-col bg-zinc-50">
      <DocumentTitle title="Page not found" />
      <header className="px-4 pt-6 sm:px-8 sm:pt-8">
        <Link to={paths.home} className="inline-flex rounded-lg">
          <Logo />
        </Link>
      </header>
      <main id={MAIN_CONTENT_ID} className="flex flex-1 items-center justify-center">
        <StatusMessage
          eyebrow="404"
          title="Page not found"
          description="Sorry, we couldn’t find the page you’re looking for. It may have been moved, or the link may be incorrect."
          actions={<ButtonLink to={paths.home}>Back to home</ButtonLink>}
        />
      </main>
    </div>
  );
}

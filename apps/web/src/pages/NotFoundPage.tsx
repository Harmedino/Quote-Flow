import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router';
import { paths } from '@/app/paths';
import { DocumentTitle } from '@/components/DocumentTitle';
import { MAIN_CONTENT_ID } from '@/components/layout/SkipLink';
import { ButtonLink } from '@/components/ui/ButtonLink';
import { Logo } from '@/components/ui/Logo';

export default function NotFoundPage() {
  return (
    <div className="flex min-h-dvh flex-col bg-ink-grid text-center">
      <DocumentTitle title="Page not found" />
      {/* Lined up with the website's header, so the logo stays put between the two. */}
      <header className="mx-auto flex h-16 w-full max-w-6xl items-center px-4 sm:px-6 lg:px-8">
        <Link to={paths.home} className="flex rounded-lg focus-visible:outline-highlight">
          <Logo tone="light" />
        </Link>
      </header>
      <main
        id={MAIN_CONTENT_ID}
        tabIndex={-1}
        className="flex flex-1 animate-fade-in-up flex-col items-center justify-center px-4 pb-16 focus:outline-none"
      >
        <p
          aria-hidden="true"
          className="font-display text-8xl font-semibold tracking-tight text-highlight sm:text-9xl"
        >
          404
        </p>
        <h1 className="mt-4 text-2xl font-semibold text-balance text-white">
          This page doesn’t exist.
        </h1>
        <p className="mt-2 max-w-sm text-sm text-pretty text-white/65">
          The link may be old or mistyped. If a business sent you a quote or invoice, ask them for
          the link again.
        </p>
        <div className="mt-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
          <ButtonLink to={paths.home} variant="highlight" size="lg" shape="pill">
            Go to the homepage
            <ArrowRight aria-hidden="true" />
          </ButtonLink>
          <ButtonLink to={paths.dashboard} variant="on-ink" size="lg" shape="pill">
            Open my dashboard
          </ButtonLink>
        </div>
      </main>
    </div>
  );
}

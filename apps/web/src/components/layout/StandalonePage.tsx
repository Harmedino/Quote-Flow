import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { paths } from '@/app/paths';
import { SITE_CONTAINER } from '@/components/marketing/site-container';
import { Logo } from '@/components/ui/Logo';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { MAIN_CONTENT_ID } from './SkipLink';

/**
 * A page with no layout of its own, such as the 404 or an error that took the layout down with
 * it: the hazard tape, the logo and dark mode, and the content centred below.
 */
export function StandalonePage({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-canvas">
      <div aria-hidden="true" className="h-1 hazard-tape" />
      {/* Lined up with the website's header, so the logo stays put between the two. */}
      <header className={`${SITE_CONTAINER} flex h-16 items-center justify-between xl:h-19`}>
        <Link to={paths.home} className="flex rounded-lg">
          <Logo />
        </Link>
        <ThemeToggle />
      </header>
      <main
        id={MAIN_CONTENT_ID}
        tabIndex={-1}
        className="flex flex-1 items-center px-4 pt-6 pb-16 focus:outline-none"
      >
        {children}
      </main>
    </div>
  );
}

import { Link, Outlet } from 'react-router';
import { paths } from '@/app/paths';
import { ButtonLink } from '@/components/ui/ButtonLink';
import { Logo } from '@/components/ui/Logo';
import { Copyright } from './Copyright';
import { MAIN_CONTENT_ID, SkipLink } from './SkipLink';

export default function MarketingLayout() {
  return (
    <div className="flex min-h-dvh flex-col bg-white">
      <SkipLink />
      <header className="border-b border-zinc-200/70">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link to={paths.home} className="flex rounded-lg">
            <Logo />
          </Link>
          <nav aria-label="Account" className="flex items-center gap-1 sm:gap-2">
            <ButtonLink to={paths.login} variant="ghost">
              Sign in
            </ButtonLink>
            <ButtonLink to={paths.register}>Start free</ButtonLink>
          </nav>
        </div>
      </header>
      <main id={MAIN_CONTENT_ID} tabIndex={-1} className="flex-1 focus:outline-none">
        <Outlet />
      </main>
      <footer className="border-t border-zinc-200/70">
        <div className="mx-auto flex max-w-6xl flex-col items-start gap-4 px-4 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <Logo />
          <Copyright />
        </div>
      </footer>
    </div>
  );
}

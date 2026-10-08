import { Plus } from 'lucide-react';
import { Link, Outlet } from 'react-router';
import { paths } from '@/app/paths';
import { ButtonLink } from '@/components/ui/ButtonLink';
import { Logo } from '@/components/ui/Logo';
import { AppNavigation } from './AppNavigation';
import { MobileNav } from './MobileNav';
import { MAIN_CONTENT_ID, SkipLink } from './SkipLink';

export default function AppLayout() {
  return (
    <div className="min-h-dvh bg-zinc-50">
      <SkipLink />

      <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-30 lg:flex lg:w-64 lg:flex-col lg:border-r lg:border-zinc-200 lg:bg-white">
        <div className="flex h-16 shrink-0 items-center px-6">
          <Link to={paths.dashboard} className="flex rounded-lg">
            <Logo />
          </Link>
        </div>
        <div className="flex flex-1 flex-col overflow-y-auto px-4 pt-2 pb-6">
          <AppNavigation />
        </div>
      </aside>

      <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-zinc-200 bg-white/95 px-4 backdrop-blur-sm sm:px-6 lg:hidden">
        <MobileNav />
        <Link to={paths.dashboard} className="flex rounded-lg">
          <Logo />
        </Link>
        <ButtonLink to={paths.newQuote} size="sm" className="ml-auto">
          <Plus aria-hidden="true" />
          New quote
        </ButtonLink>
      </header>

      <div className="lg:pl-64">
        <main
          id={MAIN_CONTENT_ID}
          tabIndex={-1}
          className="mx-auto w-full max-w-6xl px-4 py-8 focus:outline-none sm:px-6 lg:px-10 lg:py-12"
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
}

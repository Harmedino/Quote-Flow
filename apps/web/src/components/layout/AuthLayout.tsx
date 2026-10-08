import { Link, Outlet } from 'react-router';
import { paths } from '@/app/paths';
import { Card } from '@/components/ui/Card';
import { Logo } from '@/components/ui/Logo';
import { Copyright } from './Copyright';
import { MAIN_CONTENT_ID, SkipLink } from './SkipLink';

export default function AuthLayout() {
  return (
    <div className="flex min-h-dvh flex-col bg-zinc-50">
      <SkipLink />
      <header className="flex justify-center px-4 pt-10 sm:pt-16">
        <Link to={paths.home} className="flex rounded-lg">
          <Logo />
        </Link>
      </header>
      <main
        id={MAIN_CONTENT_ID}
        tabIndex={-1}
        className="flex flex-1 justify-center px-4 py-8 focus:outline-none sm:py-10"
      >
        <div className="w-full max-w-md">
          <Card className="px-6 py-8 sm:px-10 sm:py-10">
            <Outlet />
          </Card>
        </div>
      </main>
      <footer className="px-4 pb-8 text-center">
        <Copyright />
      </footer>
    </div>
  );
}

import { Link, Outlet } from 'react-router';
import { paths } from '@/app/paths';
import { Logo } from '@/components/ui/Logo';
import { MAIN_CONTENT_ID } from './SkipLink';

/** Customer-facing documents: no app chrome, just the document on a neutral page. */
export default function PublicDocumentLayout() {
  return (
    <div className="flex min-h-dvh flex-col bg-zinc-100">
      <main
        id={MAIN_CONTENT_ID}
        tabIndex={-1}
        className="flex-1 px-4 py-8 focus:outline-none sm:px-6 sm:py-12"
      >
        <div className="mx-auto w-full max-w-3xl">
          <Outlet />
        </div>
      </main>
      <footer className="flex justify-center px-4 pb-10">
        <Link
          to={paths.home}
          className="inline-flex items-center gap-2 rounded-lg text-xs font-medium text-zinc-600 transition-colors hover:text-zinc-800"
        >
          Powered by
          <Logo size="sm" />
        </Link>
      </footer>
    </div>
  );
}

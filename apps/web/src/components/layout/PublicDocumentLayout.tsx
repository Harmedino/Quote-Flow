import { Link, Outlet, useLocation } from 'react-router';
import { APP_NAME } from '@/app/constants';
import { paths } from '@/app/paths';
import { LogoMark } from '@/components/ui/Logo';
import { DemoBar } from '@/features/public-documents/DemoBar';
import { DocumentBand } from '@/features/public-documents/DocumentBand';
import { isFromDemo } from '@/features/public-documents/demo-state';
import { MAIN_CONTENT_ID } from './SkipLink';

/**
 * Customer-facing documents: no app chrome, a colour band (DocumentBand) with the page's first
 * card overlapping it, and a quiet "Powered by" line at the end.
 */
export default function PublicDocumentLayout() {
  const fromDemo = isFromDemo(useLocation().state);
  return (
    <div className="flex min-h-dvh flex-col bg-stone-50">
      {fromDemo && <DemoBar />}
      <main
        id={MAIN_CONTENT_ID}
        tabIndex={-1}
        className="relative isolate flex-1 px-4 pt-20 focus:outline-none sm:px-6 sm:pt-36 print:p-0"
      >
        <DocumentBand />
        <div className="mx-auto w-full max-w-3xl lg:max-w-5xl">
          <Outlet />
        </div>
      </main>
      <footer className="flex justify-center px-4 pt-10 pb-12 print:hidden">
        <Link
          to={paths.home}
          className="inline-flex items-center gap-1.5 rounded-lg text-xs text-stone-500 transition-colors hover:text-stone-800"
        >
          Powered by
          <LogoMark className="size-4" />
          <span className="font-semibold text-stone-600">{APP_NAME}</span>
        </Link>
      </footer>
    </div>
  );
}

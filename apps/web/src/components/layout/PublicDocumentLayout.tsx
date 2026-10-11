import { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router';
import { paths } from '@/app/paths';
import { Logo } from '@/components/ui/Logo';
import type { PublicPageOutletContext } from '@/features/public-documents/AnswerBarSlot';
import { DemoBar } from '@/features/public-documents/DemoBar';
import { isFromDemo } from '@/features/public-documents/demo-state';
import '@/features/public-documents/public-page.css';
import { MAIN_CONTENT_ID } from './SkipLink';

/**
 * Customer-facing documents: no app chrome and no theme toggle. The page stays light, like the
 * paper it stands for, and belongs to the business: QuoteFlow only signs the footer.
 */
export default function PublicDocumentLayout() {
  const fromDemo = isFromDemo(useLocation().state);
  const [answerBarSlot, setAnswerBarSlot] = useState<HTMLDivElement | null>(null);
  const context: PublicPageOutletContext = { answerBarSlot };
  return (
    <div className="public-page flex min-h-dvh scheme-light flex-col bg-canvas text-ink">
      {fromDemo && <DemoBar />}
      <main id={MAIN_CONTENT_ID} tabIndex={-1} className="flex-1 focus:outline-none">
        <Outlet context={context} />
      </main>
      <footer className="flex justify-center px-4 pt-8 pb-10 print:hidden">
        <Link
          to={paths.home}
          className="inline-flex items-center gap-2 rounded-lg text-[12.5px] text-muted transition-colors hover:text-ink"
        >
          Sent with
          <Logo size="sm" />
        </Link>
      </footer>
      {/* A child of the full-height page, so what a page puts here (AnswerBarSlot) stays pinned. */}
      <div ref={setAnswerBarSlot} className="sticky bottom-0 z-20" />
    </div>
  );
}

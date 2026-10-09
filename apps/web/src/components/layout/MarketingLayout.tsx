import { useEffect } from 'react';
import { Outlet } from 'react-router';
import { MarketingFooter } from '@/components/marketing/MarketingFooter';
import { MarketingHeader } from '@/components/marketing/MarketingHeader';
import { MarketingSiteContext } from '@/components/marketing/marketing-site';
import { MAIN_CONTENT_ID, SkipLink } from './SkipLink';

/**
 * Opening the website at a #section (e.g. /solutions#cleaning from a shared link) scrolls to it.
 * The router's ScrollRestoration only handles hashes on navigations: on a first load it runs
 * before the lazy page exists. This runs once the layout, and so its page, has rendered.
 */
function useScrollToInitialHash() {
  useEffect(() => {
    const id = decodeURIComponent(window.location.hash.slice(1));
    if (id) document.getElementById(id)?.scrollIntoView();
  }, []);
}

/** The public website: ink header and footer around pages on the warm paper background. */
export default function MarketingLayout() {
  useScrollToInitialHash();
  return (
    <div className="flex min-h-dvh flex-col bg-paper text-stone-900">
      <SkipLink />
      <MarketingHeader />
      <main id={MAIN_CONTENT_ID} tabIndex={-1} className="flex-1 focus:outline-none">
        <MarketingSiteContext value={true}>
          <Outlet />
        </MarketingSiteContext>
      </main>
      <MarketingFooter />
    </div>
  );
}

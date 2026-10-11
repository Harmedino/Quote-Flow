import { Outlet, ScrollRestoration, useNavigation } from 'react-router';

export function RootRoute() {
  // Route chunks load on demand, so a navigation can take a moment before the page changes.
  const pending = useNavigation().state !== 'idle';

  return (
    <>
      {/* Every fresh page load has the key "default", so those are told apart by path; otherwise
          opening a new URL in the tab would restore the previous page's scroll position. */}
      <ScrollRestoration
        getKey={(location) => (location.key === 'default' ? location.pathname : location.key)}
      />
      {/* The hazard tape scrolling along the top, over every layout's own (or the lack of one). */}
      {pending && (
        <div aria-hidden="true" className="fixed inset-x-0 top-0 z-50 animate-route-pending">
          <div className="h-1 hazard-tape animate-hazard-scroll motion-reduce:animate-none" />
        </div>
      )}
      <div role="status" className="sr-only">
        {pending ? 'Loading…' : ''}
      </div>
      <Outlet />
    </>
  );
}

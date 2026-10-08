import { Outlet, ScrollRestoration, useNavigation } from 'react-router';

export function RootRoute() {
  // Route chunks load on demand, so a navigation can take a moment before the page changes.
  const pending = useNavigation().state !== 'idle';

  return (
    <>
      <ScrollRestoration />
      {pending && (
        <div
          aria-hidden="true"
          className="fixed inset-x-0 top-0 z-50 h-0.5 bg-brand-600 animate-route-pending motion-reduce:animate-none"
        />
      )}
      <div role="status" className="sr-only">
        {pending ? 'Loading…' : ''}
      </div>
      <Outlet />
    </>
  );
}

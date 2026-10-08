import { Outlet, ScrollRestoration } from 'react-router';

export function RootRoute() {
  return (
    <>
      <ScrollRestoration />
      <Outlet />
    </>
  );
}

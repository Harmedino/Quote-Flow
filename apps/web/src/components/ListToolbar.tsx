import type { ReactNode } from 'react';

/** The search and filter row above a list, on the page rather than inside the list's panel. */
export function ListToolbar({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      {children}
    </div>
  );
}

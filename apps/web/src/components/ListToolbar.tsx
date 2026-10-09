import type { ReactNode } from 'react';

/** The search and filter row at the top of a list card. */
export function ListToolbar({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col gap-3 border-b border-zinc-200 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
      {children}
    </div>
  );
}

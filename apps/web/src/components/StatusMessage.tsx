import type { ReactNode } from 'react';

export interface StatusMessageProps {
  eyebrow: string;
  title: string;
  description: string;
  actions: ReactNode;
}

/** Centered message for full-page states such as "not found" or an unexpected error. */
export function StatusMessage({ eyebrow, title, description, actions }: StatusMessageProps) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4 py-16">
      <div className="max-w-md text-center">
        <p className="text-sm font-semibold text-brand-600">{eyebrow}</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-balance text-zinc-950 sm:text-4xl">
          {title}
        </h1>
        <p className="mt-4 text-base text-pretty text-zinc-600">{description}</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">{actions}</div>
      </div>
    </div>
  );
}

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
      <div className="max-w-md animate-fade-in-up text-center">
        <p className="text-sm font-medium text-brand-700">{eyebrow}</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-balance text-stone-900 sm:text-[2.6rem] sm:leading-[1.1]">
          {title}
        </h1>
        <p className="mt-4 text-base text-pretty text-stone-600">{description}</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">{actions}</div>
      </div>
    </div>
  );
}

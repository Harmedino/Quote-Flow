import type { MouseEvent } from 'react';

export const MAIN_CONTENT_ID = 'main-content';

/** Lets keyboard users jump past navigation. Focus is moved manually so the router never sees a hash change. */
export function SkipLink() {
  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    const main = document.getElementById(MAIN_CONTENT_ID);
    if (main) {
      event.preventDefault();
      main.focus();
      main.scrollIntoView();
    }
  }

  return (
    <a
      href={`#${MAIN_CONTENT_ID}`}
      onClick={handleClick}
      className="fixed top-3 left-3 z-50 -translate-y-20 rounded-lg border border-stone-200 bg-surface px-4 py-2.5 text-sm font-medium text-stone-900 shadow-[var(--shadow-elevated)] focus:translate-y-0"
    >
      Skip to content
    </a>
  );
}

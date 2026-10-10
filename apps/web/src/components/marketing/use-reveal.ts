import { type RefCallback, useCallback } from 'react';

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

/** Reveal a little before the element is fully in view, as ServiceBook does. */
const ROOT_MARGIN = '0px 0px -80px 0px';

let observer: IntersectionObserver | undefined;

/** One observer for every revealed element on the page. */
function sharedObserver(): IntersectionObserver {
  observer ??= new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.setAttribute('data-reveal', 'shown');
        observer?.unobserve(entry.target);
      }
    },
    { rootMargin: ROOT_MARGIN },
  );
  return observer;
}

function canReveal(): boolean {
  return (
    typeof IntersectionObserver !== 'undefined' &&
    !window.matchMedia?.(REDUCED_MOTION_QUERY).matches
  );
}

/**
 * Fades an element up once, the first time it scrolls into view. Content is visible unless
 * this runs: without IntersectionObserver, with reduced motion, and in server-rendered tests
 * it simply stays put. The ref runs before the first paint, so nothing flashes.
 */
export function useReveal<T extends Element>(): RefCallback<T> {
  return useCallback((element: T | null) => {
    if (!element || !canReveal()) return;
    element.setAttribute('data-reveal', 'pending');
    const io = sharedObserver();
    io.observe(element);
    return () => io.unobserve(element);
  }, []);
}

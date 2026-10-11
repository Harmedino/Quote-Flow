import { useCallback, useSyncExternalStore } from 'react';

/** Tailwind's `sm` and `lg` breakpoints: from `lg` the app has its desktop top bar. */
export const SM_QUERY = '(min-width: 40rem)';
export const DESKTOP_QUERY = '(min-width: 64rem)';

/** Whether a media query matches, kept up to date as the window changes. */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const list = window.matchMedia(query);
      list.addEventListener('change', onChange);
      return () => list.removeEventListener('change', onChange);
    },
    [query],
  );
  return useSyncExternalStore(subscribe, () => window.matchMedia(query).matches);
}

import { useCallback, useState } from 'react';

/**
 * A ref callback and the width of the element it is attached to, kept up to date as the element
 * resizes. The width is 0 until the first measurement.
 */
export function useElementWidth<T extends HTMLElement>(): [
  (element: T | null) => () => void,
  number,
] {
  const [width, setWidth] = useState(0);
  const ref = useCallback((element: T | null) => {
    const observer = new ResizeObserver(([entry]) => {
      if (entry) setWidth(entry.contentRect.width);
    });
    if (element) observer.observe(element);
    return () => observer.disconnect();
  }, []);
  return [ref, width];
}

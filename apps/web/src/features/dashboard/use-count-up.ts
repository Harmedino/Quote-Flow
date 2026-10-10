import { useEffect, useRef, useState } from 'react';

const DURATION_MS = 900;

function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Counts from the last shown value (zero at first) up to `value` with an ease-out, so figures
 * settle into place. With reduced motion it returns `value` straight away.
 */
export function useCountUp(value: number): number {
  const [animate] = useState(() => !prefersReducedMotion());
  const [shown, setShown] = useState(animate ? 0 : value);
  const shownRef = useRef(shown);

  useEffect(() => {
    if (!animate) return;
    const from = shownRef.current;
    let start: number | undefined;
    let frame = requestAnimationFrame(function step(now) {
      start ??= now;
      const progress = Math.min(1, (now - start) / DURATION_MS);
      const next = from + (value - from) * (1 - (1 - progress) ** 3);
      shownRef.current = next;
      setShown(next);
      if (progress < 1) frame = requestAnimationFrame(step);
    });
    return () => cancelAnimationFrame(frame);
  }, [animate, value]);

  return animate ? shown : value;
}

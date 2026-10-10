import { useEffect, useEffectEvent } from 'react';
import { useSearchParams } from 'react-router';

/**
 * Runs `onFlag` when the URL carries `?<name>=1` (e.g. `/customers?new=1` from an "Add a
 * customer" shortcut), then drops the flag in place, so a reload or Back does not run it again.
 */
export function useSearchFlag(name: string, onFlag: () => void): void {
  const [searchParams, setSearchParams] = useSearchParams();
  const flagged = searchParams.get(name) === '1';
  const handleFlag = useEffectEvent(onFlag);

  useEffect(() => {
    if (!flagged) return;
    handleFlag();
    setSearchParams(
      (current) => {
        const next = new URLSearchParams(current);
        next.delete(name);
        return next;
      },
      { replace: true },
    );
  }, [flagged, name, setSearchParams]);
}

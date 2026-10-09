import { useEffect, useState } from 'react';

/** A section counts as current while it crosses this band just above the middle of the screen. */
const CURRENT_BAND = '-40% 0px -55% 0px';

/** The id of the section on screen, for highlighting it in a section nav. */
export function useActiveSection(ids: readonly string[]): string | undefined {
  const [active, setActive] = useState<string | undefined>(ids[0]);

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(
      (entries) => {
        const current = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (current) setActive(current.target.id);
      },
      { rootMargin: CURRENT_BAND },
    );
    // Above the first section nothing crosses the band, so the first one stays current.
    const onScroll = () => {
      const first = ids[0] && document.getElementById(ids[0]);
      if (first && first.getBoundingClientRect().top > window.innerHeight * 0.4) setActive(ids[0]);
    };
    for (const id of ids) {
      const section = document.getElementById(id);
      if (section) observer.observe(section);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', onScroll);
    };
  }, [ids]);

  return active;
}

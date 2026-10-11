/** Space kept between a focused element and the bar above it. */
const GAP_PX = 16;

/**
 * A ref callback for a bar pinned to the bottom of the screen. While the bar shows, the page's
 * bottom scroll padding covers it (its height plus how far it floats above the bottom edge, the
 * phone tab bar included), so the browser scrolls a focused field above the bar rather than
 * behind it (WCAG 2.4.11). Otherwise the stylesheet's default applies.
 */
export function bottomBarClearance(bar: HTMLElement | null): (() => void) | undefined {
  if (!bar) return undefined;
  const root = document.documentElement;
  const update = () => {
    if (bar.offsetHeight === 0) {
      root.style.removeProperty('scroll-padding-bottom');
      return;
    }
    const offset = Number.parseFloat(getComputedStyle(bar).bottom) || 0;
    root.style.scrollPaddingBottom = `${Math.ceil(bar.offsetHeight + offset + GAP_PX)}px`;
  };
  // Resizing covers both the bar's own height and the breakpoints that move or hide it.
  const observer = new ResizeObserver(update);
  observer.observe(bar);
  window.addEventListener('resize', update);
  return () => {
    observer.disconnect();
    window.removeEventListener('resize', update);
    root.style.removeProperty('scroll-padding-bottom');
  };
}

/**
 * Shown while the first route loads: the hazard tape scrolling along the top of an empty page.
 * It fades in late, so fast loads never flash it.
 */
export function PageLoader() {
  return (
    <div role="status" className="min-h-dvh animate-fade-in [animation-delay:300ms]">
      <div aria-hidden="true" className="h-1 hazard-tape animate-hazard-scroll" />
      <span className="sr-only">Loading</span>
    </div>
  );
}

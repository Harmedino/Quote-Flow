import { Spinner } from './ui/Spinner';

/** Shown while the first route loads; fades in late so fast loads never flash a spinner. */
export function PageLoader() {
  return (
    <div className="flex min-h-dvh animate-fade-in items-center justify-center text-brand-600 [animation-delay:300ms]">
      <Spinner label="Loading" className="size-6" />
    </div>
  );
}

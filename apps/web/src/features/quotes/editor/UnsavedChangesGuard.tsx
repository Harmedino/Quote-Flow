import { useEffect } from 'react';
import { useBlocker } from 'react-router';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

export interface UnsavedChangesGuardProps {
  /** Whether leaving now would lose changes. Read at navigation time. */
  shouldBlock: () => boolean;
  /** Whether the browser should warn on reload or tab close. */
  dirty: boolean;
}

/** Asks before in-app navigation (and lets the browser warn before unloading) with unsaved changes. */
export function UnsavedChangesGuard({ shouldBlock, dirty }: UnsavedChangesGuardProps) {
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      currentLocation.pathname !== nextLocation.pathname && shouldBlock(),
  );

  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  return (
    <ConfirmDialog
      open={blocker.state === 'blocked'}
      title="Leave without saving?"
      description="Your changes to this quote haven’t been saved and will be lost."
      confirmLabel="Leave without saving"
      onConfirm={() => blocker.proceed?.()}
      onCancel={() => blocker.reset?.()}
    />
  );
}

import { useMutation } from '@tanstack/react-query';
import { LogOut, MonitorSmartphone } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { signOutEverywhere } from '@/features/auth/session';
import { getErrorMessage } from '@/lib/api-error';
import { SettingsSection } from '../SettingsSection';

export function SessionsSection() {
  const [confirming, setConfirming] = useState(false);
  // On success the session ends and the app layout moves to the sign-in page.
  const signOutAll = useMutation({ mutationFn: signOutEverywhere });

  return (
    <SettingsSection
      title="Sessions"
      description="Signed in on a shared or lost device? Sign out everywhere at once."
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-stone-100 text-stone-600">
            <MonitorSmartphone aria-hidden="true" className="size-5" />
          </span>
          <p className="pt-0.5 text-sm text-pretty text-stone-600">
            Sign out of QuoteFlow on every device and browser, including this one.
          </p>
        </div>
        <Button
          variant="secondary"
          className="shrink-0"
          onClick={() => {
            signOutAll.reset();
            setConfirming(true);
          }}
        >
          <LogOut aria-hidden="true" />
          Sign out of all devices
        </Button>
      </div>
      <ConfirmDialog
        open={confirming}
        title="Sign out of all devices?"
        description="You’ll be signed out everywhere, including this browser, and will need your password to sign in again."
        confirmLabel="Sign out everywhere"
        pending={signOutAll.isPending}
        error={signOutAll.isError ? getErrorMessage(signOutAll.error) : null}
        onConfirm={() => signOutAll.mutate()}
        onCancel={() => setConfirming(false)}
      />
    </SettingsSection>
  );
}

import { LogOut } from 'lucide-react';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { useSignOut } from '@/features/auth/use-sign-out';
import { useAuthenticatedSession } from '@/features/auth/use-session';
import { getErrorMessage } from '@/lib/api-error';
import { AccountSummary } from './AccountSummary';

/** The signed-in account and a sign-out action, at the foot of the mobile drawer. */
export function MobileAccountPanel() {
  const session = useAuthenticatedSession();
  const signOut = useSignOut();

  return (
    <section aria-label="Account" className="mt-6 border-t border-zinc-200 pt-5">
      <AccountSummary session={session} />
      {signOut.isError && (
        <Alert tone="danger" className="mt-4">
          Couldn’t sign out. {getErrorMessage(signOut.error)}
        </Alert>
      )}
      <Button
        variant="secondary"
        className="mt-4 w-full"
        loading={signOut.isPending}
        onClick={() => signOut.mutate()}
      >
        {!signOut.isPending && <LogOut aria-hidden="true" />}
        Sign out
      </Button>
    </section>
  );
}

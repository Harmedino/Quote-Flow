import { changePasswordInputSchema } from '@quoteflow/shared';
import { useMutation } from '@tanstack/react-query';
import { type FormEvent, useState } from 'react';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Field } from '@/components/ui/Field';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { changePassword } from '@/features/auth/auth-api';
import { useAuthenticatedSession } from '@/features/auth/use-session';
import { type FieldErrors, getSubmitErrors, validateForm } from '@/lib/forms';
import { useForm } from '@/lib/use-form';
import { SettingsSection } from '../SettingsSection';

const EMPTY = { currentPassword: '', newPassword: '', confirmPassword: '' };

/** The confirmation only guards against typos, so it is checked here and never sent. */
function confirmationError(newPassword: string, confirmPassword: string): string | undefined {
  if (!confirmPassword) {
    return 'Confirm your new password';
  }
  return confirmPassword === newPassword ? undefined : 'Passwords don’t match';
}

export function ChangePasswordSection() {
  const { user } = useAuthenticatedSession();
  const form = useForm(EMPTY);
  const change = useMutation({ mutationFn: changePassword });
  const [changed, setChanged] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (change.isPending) {
      return;
    }
    const { confirmPassword, ...input } = form.values;
    const result = validateForm(changePasswordInputSchema, input);
    const mismatch = confirmationError(input.newPassword, confirmPassword);
    if (!result.success || mismatch) {
      const fieldErrors: FieldErrors = {
        ...(result.success ? {} : result.fieldErrors),
        ...(mismatch ? { confirmPassword: mismatch } : {}),
      };
      form.showErrors({ fieldErrors });
      return;
    }
    form.clearErrors();
    setChanged(false);
    try {
      await change.mutateAsync(result.data);
      form.setValues(EMPTY);
      setChanged(true);
    } catch (error) {
      form.showErrors(getSubmitErrors(error, Object.keys(EMPTY)));
    }
  }

  return (
    <SettingsSection
      title="Password"
      description="Changing your password signs you out on your other devices."
    >
      <form id={form.id} noValidate onSubmit={handleSubmit} className="space-y-5">
        {changed && (
          <Alert tone="success" title="Password changed">
            You’re still signed in here. Any other devices have been signed out and will need the
            new password.
          </Alert>
        )}
        {form.formError && <Alert tone="danger">{form.formError}</Alert>}
        {/* Lets password managers store the new password against this account. */}
        <input type="email" autoComplete="username" value={user.email} readOnly hidden />
        <Field label="Current password" error={form.fieldErrors.currentPassword} required>
          <PasswordInput {...form.bind('currentPassword')} autoComplete="current-password" />
        </Field>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            label="New password"
            hint="At least 8 characters."
            error={form.fieldErrors.newPassword}
            required
          >
            <PasswordInput {...form.bind('newPassword')} autoComplete="new-password" />
          </Field>
          <Field label="Confirm new password" error={form.fieldErrors.confirmPassword} required>
            <PasswordInput {...form.bind('confirmPassword')} autoComplete="new-password" />
          </Field>
        </div>
        <div className="flex justify-end border-t border-stone-100 pt-5">
          <Button type="submit" loading={change.isPending}>
            Change password
          </Button>
        </div>
      </form>
    </SettingsSection>
  );
}

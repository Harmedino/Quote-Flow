import { USER_ROLE_LABELS, updateAccountInputSchema } from '@quoteflow/shared';
import { useMutation } from '@tanstack/react-query';
import { CircleCheck } from 'lucide-react';
import { type FormEvent, useState } from 'react';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { updateAccount } from '@/features/auth/auth-api';
import { sessionStore } from '@/features/auth/session-store';
import { useAuthenticatedSession } from '@/features/auth/use-session';
import { getSubmitErrors, validateForm } from '@/lib/forms';
import { useForm } from '@/lib/use-form';
import { SettingsSection } from '../SettingsSection';

export function ProfileSection() {
  const { user } = useAuthenticatedSession();
  const form = useForm({ name: user.name });
  const save = useMutation({ mutationFn: updateAccount });
  const [saved, setSaved] = useState(false);
  const dirty = form.values.name !== user.name;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!dirty || save.isPending) {
      return;
    }
    const result = validateForm(updateAccountInputSchema, form.values);
    if (!result.success) {
      form.showErrors({ fieldErrors: result.fieldErrors });
      return;
    }
    form.clearErrors();
    setSaved(false);
    try {
      const updated = await save.mutateAsync(result.data);
      sessionStore.updateUser(updated);
      form.setValues({ name: updated.name });
      setSaved(true);
    } catch (error) {
      form.showErrors(getSubmitErrors(error, ['name']));
    }
  }

  return (
    <SettingsSection
      title="Profile"
      description="Your name appears on the quotes and invoices you send."
    >
      <form id={form.id} noValidate onSubmit={handleSubmit} className="space-y-5">
        {form.formError && <Alert tone="danger">{form.formError}</Alert>}
        <Field label="Your name" error={form.fieldErrors.name} required>
          <Input
            {...form.bind('name')}
            onChange={(event) => {
              form.setValue('name', event.target.value);
              setSaved(false);
            }}
            autoComplete="name"
          />
        </Field>
        <Field label="Email" hint="Changing your email address isn’t available yet.">
          <Input value={user.email} readOnly className="bg-zinc-50 text-zinc-600" />
        </Field>
        <div className="space-y-1.5">
          <p className="text-sm font-medium text-zinc-900">Role</p>
          <p className="text-sm text-zinc-600">{USER_ROLE_LABELS[user.role]}</p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-x-4 gap-y-3 border-t border-zinc-100 pt-5">
          <p role="status" className="mr-auto flex items-center gap-2 text-sm text-zinc-600">
            {saved && !dirty && (
              <>
                <CircleCheck aria-hidden="true" className="size-4 text-emerald-600" />
                Profile updated
              </>
            )}
          </p>
          <Button type="submit" loading={save.isPending} aria-disabled={!dirty}>
            Save profile
          </Button>
        </div>
      </form>
    </SettingsSection>
  );
}

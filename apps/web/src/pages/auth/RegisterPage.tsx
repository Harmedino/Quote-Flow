import { registerInputSchema } from '@quoteflow/shared';
import { useMutation } from '@tanstack/react-query';
import type { FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { paths, REDIRECT_TO_PARAM, withRedirectTo } from '@/app/paths';
import { DocumentTitle } from '@/components/DocumentTitle';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { PageHeader } from '@/components/ui/PageHeader';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { Select } from '@/components/ui/Select';
import { register } from '@/features/auth/auth-api';
import { postSignInPath, sanitizeRedirectPath } from '@/features/auth/redirect';
import { sessionStore } from '@/features/auth/session-store';
import { getSubmitErrors, validateForm } from '@/lib/forms';
import { CURRENCY_OPTIONS, detectTimeZone, guessCurrency } from '@/lib/locale';
import { useForm } from '@/lib/use-form';
import { AuthFooterLink } from './AuthFooterLink';

function initialValues() {
  return {
    name: '',
    businessName: '',
    email: '',
    password: '',
    currency: guessCurrency(navigator.language),
  };
}

export default function RegisterPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = sanitizeRedirectPath(searchParams.get(REDIRECT_TO_PARAM));
  const form = useForm(initialValues);
  const signUp = useMutation({ mutationFn: register });

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = validateForm(registerInputSchema, {
      ...form.values,
      timezone: detectTimeZone(),
    });
    if (!result.success) {
      form.showErrors({ fieldErrors: result.fieldErrors });
      return;
    }
    form.clearErrors();
    try {
      sessionStore.setSession(await signUp.mutateAsync(result.data));
      await navigate(postSignInPath(redirectTo), { replace: true });
    } catch (error) {
      form.showErrors(getSubmitErrors(error, Object.keys(form.values)));
    }
  }

  return (
    <>
      <DocumentTitle title="Create your account" />
      <PageHeader
        title="Create your account"
        description="Set up your business and send your first quote today."
      />

      <form id={form.id} noValidate onSubmit={handleSubmit} className="space-y-5">
        {form.formError && <Alert tone="danger">{form.formError}</Alert>}

        <Field label="Your name" error={form.fieldErrors.name} required>
          <Input {...form.bind('name')} autoComplete="name" />
        </Field>

        <Field label="Business name" error={form.fieldErrors.businessName} required>
          <Input {...form.bind('businessName')} autoComplete="organization" />
        </Field>

        <Field label="Work email" error={form.fieldErrors.email} required>
          <Input
            {...form.bind('email')}
            type="email"
            autoComplete="email"
            inputMode="email"
            autoCapitalize="none"
            spellCheck={false}
          />
        </Field>

        <Field
          label="Password"
          hint="At least 8 characters."
          error={form.fieldErrors.password}
          required
        >
          <PasswordInput {...form.bind('password')} autoComplete="new-password" />
        </Field>

        <Field
          label="Currency"
          hint="Used for your quotes and invoices. You can change it later."
          error={form.fieldErrors.currency}
        >
          <Select {...form.bind('currency')}>
            {CURRENCY_OPTIONS.map(({ value, label }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </Field>

        <Button type="submit" loading={signUp.isPending} className="w-full">
          Create account
        </Button>
      </form>

      <AuthFooterLink
        prompt="Already have an account?"
        to={withRedirectTo(paths.login, redirectTo)}
        label="Sign in"
      />
    </>
  );
}

import { loginInputSchema } from '@quoteflow/shared';
import { useMutation } from '@tanstack/react-query';
import type { FormEvent } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router';
import { paths, REDIRECT_TO_PARAM, withRedirectTo } from '@/app/paths';
import { DocumentTitle } from '@/components/DocumentTitle';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { PageHeader } from '@/components/ui/PageHeader';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { TextLink } from '@/components/ui/TextLink';
import { DemoLoginButton } from '@/features/auth/DemoLoginButton';
import { login } from '@/features/auth/auth-api';
import {
  isSessionExpiredState,
  postSignInPath,
  sanitizeRedirectPath,
} from '@/features/auth/redirect';
import { sessionStore } from '@/features/auth/session-store';
import { getSubmitErrors, validateForm } from '@/lib/forms';
import { useForm } from '@/lib/use-form';
import { AuthFooterLink } from './AuthFooterLink';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const redirectTo = sanitizeRedirectPath(searchParams.get(REDIRECT_TO_PARAM));
  const form = useForm({ email: '', password: '' });
  const signIn = useMutation({ mutationFn: login });

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = validateForm(loginInputSchema, form.values);
    if (!result.success) {
      form.showErrors({ fieldErrors: result.fieldErrors });
      return;
    }
    form.clearErrors();
    try {
      sessionStore.setSession(await signIn.mutateAsync(result.data));
      await navigate(postSignInPath(redirectTo), { replace: true });
    } catch (error) {
      form.showErrors(getSubmitErrors(error, Object.keys(form.values)));
    }
  }

  const sessionExpired = isSessionExpiredState(location.state) && !form.formError;

  return (
    <>
      <DocumentTitle title="Sign in" />
      <PageHeader title="Welcome back" description="Sign in to your QuoteFlow account." />

      <form id={form.id} noValidate onSubmit={handleSubmit} className="space-y-4">
        {sessionExpired && (
          <Alert tone="info">Your session has ended. Sign in again to continue.</Alert>
        )}
        {form.formError && <Alert tone="danger">{form.formError}</Alert>}

        <Field label="Email" error={form.fieldErrors.email} required>
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
          error={form.fieldErrors.password}
          required
          labelAction={
            <TextLink to={paths.forgotPassword} className="text-sm">
              Forgot password?
            </TextLink>
          }
        >
          <PasswordInput {...form.bind('password')} autoComplete="current-password" />
        </Field>

        <Button type="submit" size="lg" loading={signIn.isPending} className="w-full">
          Sign in
        </Button>
      </form>

      <DemoLoginButton divider size="lg" className="w-full" />

      <AuthFooterLink
        prompt="New to QuoteFlow?"
        to={withRedirectTo(paths.register, redirectTo)}
        label="Start free"
      />
    </>
  );
}

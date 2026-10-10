import { ArrowLeft } from 'lucide-react';
import { paths } from '@/app/paths';
import { DocumentTitle } from '@/components/DocumentTitle';
import { Alert } from '@/components/ui/Alert';
import { ButtonLink } from '@/components/ui/ButtonLink';
import { PageHeader } from '@/components/ui/PageHeader';
import { TextLink } from '@/components/ui/TextLink';

export default function ForgotPasswordPage() {
  return (
    <>
      <DocumentTitle title="Forgot your password" />
      <PageHeader title="Forgot your password?" />

      <Alert tone="info" title="Password reset by email isn’t available yet">
        QuoteFlow doesn’t send emails yet, so we can’t send you a reset link.
      </Alert>

      <div className="mt-6 space-y-1.5 text-sm text-pretty text-stone-600">
        <h2 className="font-sans text-sm font-semibold tracking-normal text-stone-900">
          Still signed in somewhere?
        </h2>
        <p>
          If you’re signed in on another device or browser, you can choose a new password there
          under{' '}
          <TextLink to={paths.accountSettings} className="whitespace-nowrap">
            Settings → Account
          </TextLink>
          .
        </p>
      </div>

      <ButtonLink to={paths.login} variant="secondary" size="lg" className="mt-8 w-full">
        <ArrowLeft aria-hidden="true" />
        Back to sign in
      </ButtonLink>
    </>
  );
}

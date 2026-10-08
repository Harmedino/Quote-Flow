import { KeyRound } from 'lucide-react';
import { paths } from '@/app/paths';
import { DocumentTitle } from '@/components/DocumentTitle';
import { ModulePlaceholder } from '@/components/ModulePlaceholder';
import { PageHeader } from '@/components/ui/PageHeader';
import { AuthFooterLink } from './AuthFooterLink';

export default function ForgotPasswordPage() {
  return (
    <>
      <DocumentTitle title="Reset your password" />
      <PageHeader
        title="Reset your password"
        description="Enter the email address you signed up with and we’ll help you get back in."
      />
      <ModulePlaceholder
        icon={KeyRound}
        description="Request a secure link to choose a new password."
      />
      <AuthFooterLink prompt="Remembered it?" to={paths.login} label="Back to sign in" />
    </>
  );
}

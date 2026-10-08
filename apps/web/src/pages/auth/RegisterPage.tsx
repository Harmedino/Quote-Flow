import { UserPlus } from 'lucide-react';
import { paths } from '@/app/paths';
import { DocumentTitle } from '@/components/DocumentTitle';
import { ModulePlaceholder } from '@/components/ModulePlaceholder';
import { PageHeader } from '@/components/ui/PageHeader';
import { AuthFooterLink } from './AuthFooterLink';

export default function RegisterPage() {
  return (
    <>
      <DocumentTitle title="Create your account" />
      <PageHeader
        title="Create your account"
        description="Set up your business and send your first quote today."
      />
      <ModulePlaceholder
        icon={UserPlus}
        description="Create an account for your business with your name, email address and a password."
      />
      <AuthFooterLink prompt="Already have an account?" to={paths.login} label="Sign in" />
    </>
  );
}

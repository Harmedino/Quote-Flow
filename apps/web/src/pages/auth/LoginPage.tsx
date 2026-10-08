import { LogIn } from 'lucide-react';
import { paths } from '@/app/paths';
import { DocumentTitle } from '@/components/DocumentTitle';
import { ModulePlaceholder } from '@/components/ModulePlaceholder';
import { PageHeader } from '@/components/ui/PageHeader';
import { AuthFooterLink } from './AuthFooterLink';

export default function LoginPage() {
  return (
    <>
      <DocumentTitle title="Sign in" />
      <PageHeader
        title="Sign in to QuoteFlow"
        description="Welcome back. Pick up where you left off."
      />
      <ModulePlaceholder
        icon={LogIn}
        description="Sign in securely with your email address and password."
      />
      <AuthFooterLink prompt="New to QuoteFlow?" to={paths.register} label="Start free" />
    </>
  );
}

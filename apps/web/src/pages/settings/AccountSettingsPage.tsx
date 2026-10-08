import { UserCog } from 'lucide-react';
import { DocumentTitle } from '@/components/DocumentTitle';
import { ModulePlaceholder } from '@/components/ModulePlaceholder';

export default function AccountSettingsPage() {
  return (
    <>
      <DocumentTitle title="Account settings" />
      <ModulePlaceholder
        icon={UserCog}
        description="Update your name, email address and password."
      />
    </>
  );
}

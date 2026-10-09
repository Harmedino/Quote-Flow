import { DocumentTitle } from '@/components/DocumentTitle';
import { ChangePasswordSection } from './account/ChangePasswordSection';
import { ProfileSection } from './account/ProfileSection';
import { SessionsSection } from './account/SessionsSection';

export default function AccountSettingsPage() {
  return (
    <>
      <DocumentTitle title="Account settings" />
      <div className="divide-y divide-zinc-200">
        <ProfileSection />
        <ChangePasswordSection />
        <SessionsSection />
      </div>
    </>
  );
}

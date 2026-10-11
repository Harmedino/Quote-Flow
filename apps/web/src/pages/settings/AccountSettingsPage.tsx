import { DocumentTitle } from '@/components/DocumentTitle';
import { ChangePasswordSection } from './account/ChangePasswordSection';
import { ProfileSection } from './account/ProfileSection';
import { SessionsSection } from './account/SessionsSection';

export default function AccountSettingsPage() {
  return (
    <>
      <DocumentTitle title="Account settings" />
      {/* Profile and password side by side from `lg`, so the page fills the app's column. */}
      <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
        <ProfileSection />
        <ChangePasswordSection />
        <div className="lg:col-span-2">
          <SessionsSection />
        </div>
      </div>
    </>
  );
}

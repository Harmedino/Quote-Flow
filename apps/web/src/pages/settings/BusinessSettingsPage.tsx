import { RotateCw } from 'lucide-react';
import { DocumentTitle } from '@/components/DocumentTitle';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { useAuthenticatedSession } from '@/features/auth/use-session';
import { useBusinessQuery } from '@/features/business/use-business';
import { BusinessSettingsForm } from './business/BusinessSettingsForm';

export default function BusinessSettingsPage() {
  const { user } = useAuthenticatedSession();
  const business = useBusinessQuery();
  const canEdit = user.role === 'owner';

  return (
    <>
      <DocumentTitle title="Business settings" />
      <div className="space-y-4 empty:hidden mb-8">
        {!canEdit && (
          <Alert tone="info" title="View only">
            Only the business owner can change these settings.
          </Alert>
        )}
        {business.isError && (
          <Alert tone="warning" title="We couldn’t load the latest settings">
            <p>You’re seeing the settings from when you signed in.</p>
            <Button
              variant="secondary"
              size="sm"
              className="mt-3"
              loading={business.isFetching}
              onClick={() => void business.refetch()}
            >
              <RotateCw aria-hidden="true" />
              Try again
            </Button>
          </Alert>
        )}
      </div>
      <BusinessSettingsForm business={business.data} canEdit={canEdit} />
    </>
  );
}

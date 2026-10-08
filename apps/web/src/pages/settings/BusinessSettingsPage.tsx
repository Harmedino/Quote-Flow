import { Store } from 'lucide-react';
import { DocumentTitle } from '@/components/DocumentTitle';
import { ModulePlaceholder } from '@/components/ModulePlaceholder';

export default function BusinessSettingsPage() {
  return (
    <>
      <DocumentTitle title="Business settings" />
      <ModulePlaceholder
        icon={Store}
        description="Set your business name, logo, brand color, currency, tax rate and document numbering."
      />
    </>
  );
}

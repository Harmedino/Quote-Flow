import { FilePlus } from 'lucide-react';
import { paths } from '@/app/paths';
import { DocumentTitle } from '@/components/DocumentTitle';
import { ModulePlaceholder } from '@/components/ModulePlaceholder';
import { PageHeader } from '@/components/ui/PageHeader';

export default function NewQuotePage() {
  return (
    <>
      <DocumentTitle title="New quote" />
      <PageHeader
        title="New quote"
        description="Build a professional quote from your saved services in a few clicks."
        back={{ to: paths.quotes, label: 'Quotes' }}
      />
      <ModulePlaceholder
        icon={FilePlus}
        description="Pick a customer, add line items from your services, and preview totals as you go."
      />
    </>
  );
}

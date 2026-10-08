import { FilePen } from 'lucide-react';
import { useParams } from 'react-router';
import { paths } from '@/app/paths';
import { DocumentTitle } from '@/components/DocumentTitle';
import { ModulePlaceholder } from '@/components/ModulePlaceholder';
import { PageHeader } from '@/components/ui/PageHeader';

export default function EditQuotePage() {
  const { quoteId } = useParams<'quoteId'>();

  return (
    <>
      <DocumentTitle title="Edit quote" />
      <PageHeader
        title="Edit quote"
        description="Update line items, pricing and terms before you send."
        back={quoteId ? { to: paths.quote(quoteId), label: 'Back to quote' } : undefined}
      />
      <ModulePlaceholder
        icon={FilePen}
        description="Change items, discounts, tax and notes, with totals recalculated as you type."
      />
    </>
  );
}

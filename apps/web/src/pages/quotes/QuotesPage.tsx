import { FileText } from 'lucide-react';
import { DocumentTitle } from '@/components/DocumentTitle';
import { ModulePlaceholder } from '@/components/ModulePlaceholder';
import { PageHeader } from '@/components/ui/PageHeader';

export default function QuotesPage() {
  return (
    <>
      <DocumentTitle title="Quotes" />
      <PageHeader title="Quotes" description="Create, send and track quotes for your customers." />
      <ModulePlaceholder
        icon={FileText}
        description="Find any quote by status, customer or number, and see which ones need a follow-up."
      />
    </>
  );
}

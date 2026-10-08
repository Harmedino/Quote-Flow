import { FileText } from 'lucide-react';
import { paths } from '@/app/paths';
import { DocumentTitle } from '@/components/DocumentTitle';
import { ModulePlaceholder } from '@/components/ModulePlaceholder';
import { PageHeader } from '@/components/ui/PageHeader';

export default function QuoteDetailPage() {
  return (
    <>
      <DocumentTitle title="Quote" />
      <PageHeader
        title="Quote"
        description="Review this quote, share it with your customer and track their response."
        back={{ to: paths.quotes, label: 'Quotes' }}
      />
      <ModulePlaceholder
        icon={FileText}
        description="Share by link or WhatsApp, see when it’s viewed, and turn accepted quotes into invoices."
      />
    </>
  );
}

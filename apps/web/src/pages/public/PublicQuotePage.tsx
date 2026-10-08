import { FileCheck } from 'lucide-react';
import { DocumentTitle } from '@/components/DocumentTitle';
import { ModulePlaceholder } from '@/components/ModulePlaceholder';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';

export default function PublicQuotePage() {
  return (
    <>
      <DocumentTitle title="Quote" />
      <Card className="px-6 py-8 sm:px-10 sm:py-10">
        <PageHeader
          title="Quote"
          description="Review the details of this quote and respond online. No account needed."
        />
        <ModulePlaceholder
          icon={FileCheck}
          description="See the full breakdown of work and pricing, then accept or decline in one tap."
        />
      </Card>
    </>
  );
}

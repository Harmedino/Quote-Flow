import { Wrench } from 'lucide-react';
import { DocumentTitle } from '@/components/DocumentTitle';
import { ModulePlaceholder } from '@/components/ModulePlaceholder';
import { PageHeader } from '@/components/ui/PageHeader';

export default function ServicesPage() {
  return (
    <>
      <DocumentTitle title="Services" />
      <PageHeader
        title="Services"
        description="Your price list of services, ready to add to any quote."
      />
      <ModulePlaceholder
        icon={Wrench}
        description="Save the services you offer with their prices and units, so quoting takes seconds."
      />
    </>
  );
}

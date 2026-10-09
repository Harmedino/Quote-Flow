import { objectIdSchema, todayInTimeZone } from '@quoteflow/shared';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { useSearchParams } from 'react-router';
import { paths } from '@/app/paths';
import { DocumentTitle } from '@/components/DocumentTitle';
import { PageHeader } from '@/components/ui/PageHeader';
import { useBusinessQuery } from '@/features/business/use-business';
import { getCustomer } from '@/features/customers/customers-api';
import { customerKeys } from '@/features/customers/use-customers';
import { QuoteEditor } from '@/features/quotes/editor/QuoteEditor';
import { selectedCustomerFromDto } from '@/features/quotes/editor/selected-customer';
import { newQuoteFormValues } from '@/features/quotes/quote-form';
import { EditorSkeleton } from '@/features/quotes/ui/EditorSkeleton';

/** `?customerId=` preselects an active customer (e.g. from the customer's page). */
function usePreselectedCustomer() {
  const [params] = useSearchParams();
  const parsed = objectIdSchema.safeParse(params.get('customerId'));
  const customerId = parsed.success ? parsed.data : null;
  const query = useQuery({
    queryKey: customerKeys.detail(customerId ?? ''),
    queryFn: ({ signal }) => getCustomer(customerId ?? '', signal),
    enabled: customerId !== null,
  });
  const customer = query.data && !query.data.archivedAt ? query.data : null;
  return { customerId, loading: customerId !== null && query.isPending, customer };
}

export default function NewQuotePage() {
  const { data: business } = useBusinessQuery();
  const preselected = usePreselectedCustomer();
  const [today] = useState(() => todayInTimeZone(business.timezone));

  return (
    <>
      <DocumentTitle title="New quote" />
      <PageHeader
        title="New quote"
        description="Pick a customer, add items from your services, and send it in a few clicks."
        back={{ to: paths.quotes, label: 'Quotes' }}
      />
      {preselected.loading ? (
        <EditorSkeleton />
      ) : (
        <QuoteEditor
          key={preselected.customerId ?? 'new'}
          business={business}
          initialValues={newQuoteFormValues(business, today, preselected.customer?.id)}
          initialCustomer={preselected.customer && selectedCustomerFromDto(preselected.customer)}
        />
      )}
    </>
  );
}

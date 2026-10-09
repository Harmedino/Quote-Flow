import { FileX } from 'lucide-react';
import { paths } from '@/app/paths';
import { ButtonLink } from '@/components/ui/ButtonLink';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';

/** For a quote link that does not lead to a quote of this business. */
export function QuoteNotFound() {
  return (
    <Card>
      <EmptyState
        icon={FileX}
        title="Quote not found"
        description="It may have been deleted, or the link is incorrect."
        action={<ButtonLink to={paths.quotes}>Back to quotes</ButtonLink>}
      />
    </Card>
  );
}

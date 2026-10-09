import type { CustomerSnapshotDto } from '@quoteflow/shared';
import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router';
import { paths } from '@/app/paths';
import { Avatar } from '@/components/ui/Avatar';
import { PanelCard } from '@/components/ui/PanelCard';
import { ContactTiles } from '@/features/customers/ContactTiles';
import { customerSummaryLine } from '@/features/quotes/editor/selected-customer';

export interface DocumentCustomerCardProps {
  customerId: string;
  /** The customer as they appear on the document. */
  customer: CustomerSnapshotDto;
}

/** Who a quote or invoice is for: a link to their page, and one-tap call, WhatsApp or email. */
export function DocumentCustomerCard({ customerId, customer }: DocumentCustomerCardProps) {
  return (
    <PanelCard title="Customer">
      <Link
        to={paths.customer(customerId)}
        className="group -m-1.5 flex items-center gap-3 rounded-xl p-1.5 transition-colors hover:bg-stone-50"
      >
        <Avatar name={customer.name} />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-stone-900">
            {customer.name}
          </span>
          <span className="block truncate text-sm text-stone-500">
            {customerSummaryLine(customer) || 'No contact details'}
          </span>
        </span>
        <ChevronRight
          aria-hidden="true"
          className="size-4 shrink-0 text-stone-400 transition-transform group-hover:translate-x-0.5"
        />
      </Link>
      <ContactTiles phone={customer.phone} email={customer.email} className="mt-4" />
    </PanelCard>
  );
}

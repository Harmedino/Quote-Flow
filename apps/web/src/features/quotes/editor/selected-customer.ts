import type { CustomerDto, CustomerSnapshotDto } from '@quoteflow/shared';

/** The customer shown in the editor: a live record, or the snapshot on an existing quote. */
export interface SelectedCustomer extends CustomerSnapshotDto {
  id: string;
}

export function selectedCustomerFromDto(customer: CustomerDto): SelectedCustomer {
  const { id, name, email, phone, company, address } = customer;
  return { id, name, email, phone, company, address };
}

/** One line under the name: company, then email or phone. */
export function customerSummaryLine(customer: CustomerSnapshotDto): string {
  return [customer.company, customer.email ?? customer.phone].filter(Boolean).join(' · ');
}

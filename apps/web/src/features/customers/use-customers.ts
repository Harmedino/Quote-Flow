import type { CustomerDto, UpdateCustomerInput } from '@quoteflow/shared';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  type CustomerListOptions,
  archiveCustomer,
  createCustomer,
  getCustomer,
  listCustomers,
  restoreCustomer,
  updateCustomer,
} from './customers-api';

export const customerKeys = {
  all: ['customers'] as const,
  lists: () => [...customerKeys.all, 'list'] as const,
  list: (query: CustomerListOptions) => [...customerKeys.lists(), query] as const,
  detail: (id: string) => [...customerKeys.all, 'detail', id] as const,
};

/** A page of customers. The previous page stays on screen while the next one loads. */
export function useCustomersQuery(query: CustomerListOptions) {
  return useQuery({
    queryKey: customerKeys.list(query),
    queryFn: ({ signal }) => listCustomers(query, signal),
    placeholderData: keepPreviousData,
  });
}

export function useCustomerQuery(id: string) {
  return useQuery({
    queryKey: customerKeys.detail(id),
    queryFn: ({ signal }) => getCustomer(id, signal),
  });
}

/** Caches the saved customer and refreshes every customer list. */
function useCustomerSaved() {
  const queryClient = useQueryClient();
  return (customer: CustomerDto) => {
    queryClient.setQueryData(customerKeys.detail(customer.id), customer);
    return queryClient.invalidateQueries({ queryKey: customerKeys.lists() });
  };
}

export function useCreateCustomer() {
  const onSaved = useCustomerSaved();
  return useMutation({ mutationFn: createCustomer, onSuccess: onSaved });
}

export function useUpdateCustomer() {
  const onSaved = useCustomerSaved();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateCustomerInput }) =>
      updateCustomer(id, input),
    onSuccess: onSaved,
  });
}

export function useArchiveCustomer() {
  const onSaved = useCustomerSaved();
  return useMutation({ mutationFn: archiveCustomer, onSuccess: onSaved });
}

export function useRestoreCustomer() {
  const onSaved = useCustomerSaved();
  return useMutation({ mutationFn: restoreCustomer, onSuccess: onSaved });
}

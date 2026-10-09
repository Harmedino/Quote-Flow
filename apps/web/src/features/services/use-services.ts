import type { ServiceDto, UpdateServiceInput } from '@quoteflow/shared';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  type ServiceListOptions,
  createService,
  deleteService,
  listServices,
  updateService,
} from './services-api';

export const serviceKeys = {
  all: ['services'] as const,
  lists: () => [...serviceKeys.all, 'list'] as const,
  list: (query: ServiceListOptions) => [...serviceKeys.lists(), query] as const,
  detail: (id: string) => [...serviceKeys.all, 'detail', id] as const,
};

/** A page of services. The previous page stays on screen while the next one loads. */
export function useServicesQuery(query: ServiceListOptions) {
  return useQuery({
    queryKey: serviceKeys.list(query),
    queryFn: ({ signal }) => listServices(query, signal),
    placeholderData: keepPreviousData,
  });
}

function useServiceSaved() {
  const queryClient = useQueryClient();
  return (service: ServiceDto) => {
    queryClient.setQueryData(serviceKeys.detail(service.id), service);
    return queryClient.invalidateQueries({ queryKey: serviceKeys.lists() });
  };
}

export function useCreateService() {
  const onSaved = useServiceSaved();
  return useMutation({ mutationFn: createService, onSuccess: onSaved });
}

export function useUpdateService() {
  const onSaved = useServiceSaved();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateServiceInput }) =>
      updateService(id, input),
    onSuccess: onSaved,
  });
}

export function useDeleteService() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteService,
    onSuccess: (_result, id) => {
      queryClient.removeQueries({ queryKey: serviceKeys.detail(id) });
      return queryClient.invalidateQueries({ queryKey: serviceKeys.lists() });
    },
  });
}

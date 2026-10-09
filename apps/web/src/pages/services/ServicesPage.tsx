import type { ServiceDto, ServiceInput } from '@quoteflow/shared';
import { Plus, SearchX } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router';
import { NEW_PARAM } from '@/app/paths';
import { DocumentTitle } from '@/components/DocumentTitle';
import { ListSearch } from '@/components/ListSearch';
import { ListToolbar } from '@/components/ListToolbar';
import { Pagination } from '@/components/Pagination';
import { QueryError } from '@/components/QueryError';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageHeader } from '@/components/ui/PageHeader';
import { ServiceFormDialog } from '@/features/services/ServiceFormDialog';
import {
  activeFilterOf,
  readServiceListParams,
  type ServiceListParams,
  toServiceListSearchParams,
} from '@/features/services/service-list-params';
import type { ServiceListOptions } from '@/features/services/services-api';
import { useDeleteService, useServicesQuery } from '@/features/services/use-services';
import { getErrorMessage } from '@/lib/api-client';
import { cn } from '@/lib/cn';
import { useSearchFlag } from '@/lib/use-search-flag';
import { ServiceList, ServiceListSkeleton } from './ServiceList';
import { ServicesEmptyState } from './ServicesEmptyState';
import { StatusFilter } from './StatusFilter';

const PAGE_SIZE = 20;

type DialogState =
  | { mode: 'closed' }
  | { mode: 'create'; initialValues?: Partial<ServiceInput> }
  | { mode: 'edit'; service: ServiceDto };

export default function ServicesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const params = readServiceListParams(searchParams);
  const [dialog, setDialog] = useState<DialogState>({ mode: 'closed' });
  const [deleting, setDeleting] = useState<ServiceDto | null>(null);
  const deleteService = useDeleteService();

  const active = activeFilterOf(params.status);
  const query: ServiceListOptions = {
    page: params.page,
    pageSize: PAGE_SIZE,
    ...(params.search && { search: params.search }),
    ...(active !== undefined && { active }),
  };
  const services = useServicesQuery(query);

  function update(changes: Partial<ServiceListParams>, replace = false) {
    setSearchParams(toServiceListSearchParams({ ...params, page: 1, ...changes }), { replace });
  }

  // A page past the end (e.g. after deleting its last service) moves to the last page.
  const totalPages = services.data?.meta.totalPages ?? 0;
  const pastLastPage = totalPages > 0 && params.page > totalPages;
  useEffect(() => {
    if (pastLastPage) {
      setSearchParams(toServiceListSearchParams({ ...params, page: totalPages }), {
        replace: true,
      });
    }
  });

  const openCreate = (initialValues?: Partial<ServiceInput>) =>
    setDialog({ mode: 'create', initialValues });
  useSearchFlag(NEW_PARAM, () => openCreate());
  const closeDialog = () => setDialog({ mode: 'closed' });
  const filtered = Boolean(params.search) || params.status !== 'all';

  function renderContent() {
    if (services.isPending) return <ServiceListSkeleton />;
    if (services.isError) {
      return (
        <QueryError
          title="Couldn’t load services"
          error={services.error}
          onRetry={() => void services.refetch()}
          retrying={services.isRefetching}
        />
      );
    }
    const { data, meta } = services.data;
    if (meta.total === 0 && !filtered) {
      return <ServicesEmptyState onAdd={openCreate} />;
    }
    if (meta.total === 0) {
      return (
        <EmptyState
          variant="dashed"
          icon={SearchX}
          title="No services found"
          description={
            params.search
              ? `Nothing matches “${params.search}”${params.status === 'all' ? '' : ` among ${params.status} services`}.`
              : `You have no ${params.status} services.`
          }
          action={
            <Button variant="secondary" onClick={() => update({ search: '', status: 'all' })}>
              Clear filters
            </Button>
          }
        />
      );
    }
    return (
      <div
        aria-busy={services.isPlaceholderData || undefined}
        className={cn('transition-opacity', services.isPlaceholderData && 'opacity-60')}
      >
        <ServiceList
          services={data}
          onEdit={(service) => setDialog({ mode: 'edit', service })}
          onDelete={(service) => {
            deleteService.reset();
            setDeleting(service);
          }}
        />
        <Pagination meta={meta} label="services" onPageChange={(page) => update({ page })} />
      </div>
    );
  }

  return (
    <>
      <DocumentTitle title="Services" />
      <PageHeader
        title="Services"
        description="Your price list of services, ready to add to any quote."
        actions={
          <Button onClick={() => openCreate()}>
            <Plus aria-hidden="true" />
            Add service
          </Button>
        }
      />

      <div className="space-y-4">
        <StatusFilter value={params.status} onChange={(status) => update({ status })} />
        <ListToolbar>
          <ListSearch
            value={params.search}
            onSearch={(search) => update({ search }, true)}
            label="Search services"
            placeholder="Search name or description"
            className="w-full sm:max-w-xs"
          />
        </ListToolbar>
        <p className="sr-only" aria-live="polite">
          {services.data && !services.isPlaceholderData
            ? `${services.data.meta.total} ${services.data.meta.total === 1 ? 'service' : 'services'}`
            : ''}
        </p>
        {renderContent()}
      </div>

      <ServiceFormDialog
        open={dialog.mode !== 'closed'}
        service={dialog.mode === 'edit' ? dialog.service : undefined}
        initialValues={dialog.mode === 'create' ? dialog.initialValues : undefined}
        onClose={closeDialog}
        onSaved={closeDialog}
      />
      <ConfirmDialog
        open={deleting !== null}
        title={`Delete ${deleting?.name ?? 'service'}?`}
        description="It will be removed from your price list. Quotes and invoices that already include it keep their line items and prices."
        confirmLabel="Delete service"
        pending={deleteService.isPending}
        error={deleteService.isError ? getErrorMessage(deleteService.error) : null}
        onCancel={() => setDeleting(null)}
        onConfirm={() => {
          if (deleting) deleteService.mutate(deleting.id, { onSuccess: () => setDeleting(null) });
        }}
      />
    </>
  );
}

import type { ServiceDto, ServiceInput } from '@quoteflow/shared';
import type { FormEvent } from 'react';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Field } from '@/components/ui/Field';
import {
  FORM_DIALOG_FORM_CLASSES,
  FormDialog,
  FormDialogBody,
  FormDialogFooter,
} from '@/components/ui/FormDialog';
import { Input } from '@/components/ui/Input';
import { MoneyInput } from '@/components/ui/MoneyInput';
import { Textarea } from '@/components/ui/Textarea';
import { useAuthenticatedSession } from '@/features/auth/use-session';
import { getSubmitErrors } from '@/lib/forms';
import { useForm } from '@/lib/use-form';
import { buildServiceInput, toServiceFormValues } from './service-form';
import { useCreateService, useUpdateService } from './use-services';

export interface ServiceFormDialogProps {
  open: boolean;
  onClose: () => void;
  /** Called with the saved service; the caller closes the dialog (or not). */
  onSaved: (service: ServiceDto) => void;
  /** The service to edit; omit to create a new one. */
  service?: ServiceDto;
  /** Starting values for a new service, e.g. from a suggested example. */
  initialValues?: Partial<ServiceInput>;
}

/** Creates or edits a service in a modal. Prices are in the business currency. */
export function ServiceFormDialog({
  open,
  onClose,
  onSaved,
  service,
  initialValues,
}: ServiceFormDialogProps) {
  const createService = useCreateService();
  const updateService = useUpdateService();
  const pending = createService.isPending || updateService.isPending;

  return (
    <FormDialog
      open={open}
      title={service ? 'Edit service' : 'New service'}
      description={service ? undefined : 'Saved services can be added to any quote in one click.'}
      pending={pending}
      onClose={onClose}
    >
      <ServiceForm
        service={service}
        initialValues={initialValues}
        pending={pending}
        onCancel={onClose}
        onSubmit={(input) =>
          service
            ? updateService.mutateAsync({ id: service.id, input })
            : createService.mutateAsync(input)
        }
        onSaved={onSaved}
      />
    </FormDialog>
  );
}

interface ServiceFormProps {
  service?: ServiceDto;
  initialValues?: Partial<ServiceInput>;
  pending: boolean;
  onCancel: () => void;
  onSubmit: (input: ServiceInput) => Promise<ServiceDto>;
  onSaved: (service: ServiceDto) => void;
}

function ServiceForm({
  service,
  initialValues,
  pending,
  onCancel,
  onSubmit,
  onSaved,
}: ServiceFormProps) {
  const { business } = useAuthenticatedSession();
  const form = useForm(() => toServiceFormValues(service, initialValues));
  const { bind, fieldErrors: errors } = form;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // The dialog may sit inside another form (e.g. the quote builder); keep this submit to itself.
    event.stopPropagation();
    if (pending) return;
    const result = buildServiceInput(form.values);
    if (!result.success) {
      form.showErrors({ fieldErrors: result.fieldErrors });
      return;
    }
    form.clearErrors();
    try {
      onSaved(await onSubmit(result.data));
    } catch (error) {
      form.showErrors(getSubmitErrors(error, Object.keys(form.values)));
    }
  }

  const price = form.values.price === '' ? null : Number(form.values.price);

  return (
    <form id={form.id} noValidate onSubmit={handleSubmit} className={FORM_DIALOG_FORM_CLASSES}>
      <FormDialogBody className="space-y-5">
        {form.formError && <Alert tone="danger">{form.formError}</Alert>}
        <Field label="Service name" error={errors.name} required>
          <Input {...bind('name')} autoComplete="off" placeholder="e.g. Deep cleaning" />
        </Field>
        <Field
          label="Description"
          hint="Shown on the quote under the service name."
          error={errors.description}
        >
          <Textarea {...bind('description')} rows={3} />
        </Field>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label={`Price (${business.currency})`} error={errors.price} required>
            <MoneyInput
              name="price"
              value={price}
              currency={business.currency}
              onChange={(value) => form.setValue('price', value === null ? '' : String(value))}
              placeholder="0.00"
            />
          </Field>
          <Field label="Unit" hint="e.g. hour, visit, room or m²" error={errors.unit}>
            <Input {...bind('unit')} autoComplete="off" />
          </Field>
        </div>
        <label className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-stone-200 p-4">
          <span className="text-sm">
            <span className="block font-medium text-stone-900">Active</span>
            <span className="mt-0.5 block text-stone-600">
              Inactive services stay on existing quotes but aren’t offered for new ones.
            </span>
          </span>
          <input
            type="checkbox"
            role="switch"
            name="active"
            checked={form.values.active === 'true'}
            onChange={(event) => form.setValue('active', event.target.checked ? 'true' : 'false')}
            className="peer sr-only"
          />
          <span
            aria-hidden="true"
            className="relative h-6 w-11 shrink-0 rounded-full bg-stone-300 transition-colors peer-checked:bg-brand-600 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brand-500 after:absolute after:top-0.5 after:left-0.5 after:size-5 after:rounded-full after:bg-white after:shadow-sm after:transition-transform peer-checked:after:translate-x-5"
          />
        </label>
      </FormDialogBody>
      <FormDialogFooter>
        <Button variant="secondary" onClick={onCancel} disabled={pending}>
          Cancel
        </Button>
        <Button type="submit" loading={pending}>
          {service ? 'Save changes' : 'Add service'}
        </Button>
      </FormDialogFooter>
    </form>
  );
}

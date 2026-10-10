import type { CustomerDto, CustomerInput } from '@quoteflow/shared';
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
import { Textarea } from '@/components/ui/Textarea';
import { getSubmitErrors } from '@/lib/forms';
import { useForm } from '@/lib/use-form';
import { buildCustomerInput, toCustomerFormValues } from './customer-form';
import { useCreateCustomer, useUpdateCustomer } from './use-customers';

export interface CustomerFormDialogProps {
  open: boolean;
  onClose: () => void;
  /** Called with the saved customer; the caller closes the dialog (or not). */
  onSaved: (customer: CustomerDto) => void;
  /** The customer to edit; omit to create a new one. */
  customer?: CustomerDto;
}

/** Creates or edits a customer in a modal. */
export function CustomerFormDialog({ open, onClose, onSaved, customer }: CustomerFormDialogProps) {
  const createCustomer = useCreateCustomer();
  const updateCustomer = useUpdateCustomer();
  const pending = createCustomer.isPending || updateCustomer.isPending;

  return (
    <FormDialog
      open={open}
      title={customer ? 'Edit customer' : 'New customer'}
      description={customer ? undefined : 'Only a name is required. You can add the rest any time.'}
      pending={pending}
      onClose={onClose}
    >
      <CustomerForm
        customer={customer}
        pending={pending}
        onCancel={onClose}
        onSubmit={(input) =>
          customer
            ? updateCustomer.mutateAsync({ id: customer.id, input })
            : createCustomer.mutateAsync(input)
        }
        onSaved={onSaved}
      />
    </FormDialog>
  );
}

interface CustomerFormProps {
  customer?: CustomerDto;
  pending: boolean;
  onCancel: () => void;
  onSubmit: (input: CustomerInput) => Promise<CustomerDto>;
  onSaved: (customer: CustomerDto) => void;
}

function CustomerForm({ customer, pending, onCancel, onSubmit, onSaved }: CustomerFormProps) {
  const form = useForm(() => toCustomerFormValues(customer));
  const { bind, fieldErrors: errors } = form;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // The dialog may sit inside another form (e.g. the quote builder); keep this submit to itself.
    event.stopPropagation();
    if (pending) return;
    const result = buildCustomerInput(form.values);
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

  return (
    <form id={form.id} noValidate onSubmit={handleSubmit} className={FORM_DIALOG_FORM_CLASSES}>
      <FormDialogBody>
        {form.formError && (
          <Alert tone="danger" className="mb-5">
            {form.formError}
          </Alert>
        )}
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Name" error={errors.name} required className="sm:col-span-2">
            <Input {...bind('name')} autoComplete="off" placeholder="e.g. Grace Okafor" />
          </Field>
          <Field label="Company" error={errors.company} className="sm:col-span-2">
            <Input {...bind('company')} autoComplete="off" />
          </Field>
          <Field label="Email" error={errors.email}>
            <Input
              {...bind('email')}
              type="email"
              inputMode="email"
              autoComplete="off"
              autoCapitalize="none"
              spellCheck={false}
            />
          </Field>
          <Field label="Phone" error={errors.phone}>
            <Input {...bind('phone')} type="tel" autoComplete="off" />
          </Field>
        </div>

        <fieldset className="mt-6 rounded-2xl border border-stone-200 p-4 sm:p-5">
          <legend className="px-1.5 text-sm font-semibold text-stone-900">
            Address <span className="font-normal text-stone-500">· optional</span>
          </legend>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Address line 1" error={errors['address.line1']} className="sm:col-span-2">
              <Input {...bind('address.line1')} autoComplete="off" />
            </Field>
            <Field label="Address line 2" error={errors['address.line2']} className="sm:col-span-2">
              <Input {...bind('address.line2')} autoComplete="off" />
            </Field>
            <Field label="City" error={errors['address.city']}>
              <Input {...bind('address.city')} autoComplete="off" />
            </Field>
            <Field label="State or region" error={errors['address.state']}>
              <Input {...bind('address.state')} autoComplete="off" />
            </Field>
            <Field label="Postal code" error={errors['address.postalCode']}>
              <Input {...bind('address.postalCode')} autoComplete="off" />
            </Field>
            <Field label="Country" error={errors['address.country']}>
              <Input {...bind('address.country')} autoComplete="off" />
            </Field>
          </div>
        </fieldset>

        <Field
          label="Notes"
          hint="Only your team sees these, e.g. gate code or preferred contact time."
          error={errors.notes}
          className="mt-6"
        >
          <Textarea {...bind('notes')} rows={3} />
        </Field>
      </FormDialogBody>
      <FormDialogFooter>
        <Button variant="secondary" onClick={onCancel} disabled={pending}>
          Cancel
        </Button>
        <Button type="submit" loading={pending}>
          {customer ? 'Save changes' : 'Add customer'}
        </Button>
      </FormDialogFooter>
    </form>
  );
}

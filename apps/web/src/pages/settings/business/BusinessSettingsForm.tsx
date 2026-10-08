import {
  type BusinessDto,
  INVOICE_DUE_DAYS_RANGE,
  QUOTE_VALIDITY_DAYS_RANGE,
  TEXT_LIMITS,
} from '@quoteflow/shared';
import { type FormEvent, useMemo, useState } from 'react';
import { FormActionBar } from '@/components/FormActionBar';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import {
  buildBusinessUpdate,
  changedBusinessFields,
  previewDocumentNumber,
  rebaseBusinessFormValues,
  toBusinessFormValues,
  type BusinessFormValues,
} from '@/features/business/business-form';
import { useUpdateBusiness } from '@/features/business/use-business';
import { getSubmitErrors } from '@/lib/forms';
import { CURRENCY_OPTIONS, timeZoneOptions } from '@/lib/locale';
import { useForm } from '@/lib/use-form';
import { SettingsSection } from '../SettingsSection';
import { BrandColorField } from './BrandColorField';

interface SavedState {
  /** The server copy the form was last reset from. */
  source: BusinessDto;
  values: BusinessFormValues;
}

function savedStateFrom(business: BusinessDto): SavedState {
  return { source: business, values: toBusinessFormValues(business) };
}

export interface BusinessSettingsFormProps {
  business: BusinessDto;
  /** Staff see the same settings, read-only. */
  canEdit: boolean;
}

export function BusinessSettingsForm({ business, canEdit }: BusinessSettingsFormProps) {
  const updateBusiness = useUpdateBusiness();
  const [saved, setSaved] = useState(() => savedStateFrom(business));
  const form = useForm(saved.values);
  const [justSaved, setJustSaved] = useState(false);
  const dirty = changedBusinessFields(form.values, saved.values).length > 0;

  // Adopt newer server data (e.g. from a background refetch) unless there are unsaved edits.
  if (business !== saved.source && !dirty && !updateBusiness.isPending) {
    const next = savedStateFrom(business);
    setSaved(next);
    form.setValues(next.values);
  }

  const savedTimeZone = saved.values.timezone;
  const timeZones = useMemo(() => timeZoneOptions([savedTimeZone]), [savedTimeZone]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canEdit || !dirty || updateBusiness.isPending) {
      return;
    }
    const submitted = form.values;
    const result = buildBusinessUpdate(submitted, saved.values);
    if (!result.success) {
      form.showErrors({ fieldErrors: result.fieldErrors });
      return;
    }
    form.clearErrors();
    try {
      const next = savedStateFrom(await updateBusiness.mutateAsync(result.data));
      setSaved(next);
      form.setValues((current) => rebaseBusinessFormValues(current, submitted, next.values));
      setJustSaved(true);
    } catch (error) {
      form.showErrors(getSubmitErrors(error, Object.keys(submitted)));
    }
  }

  function handleDiscard() {
    form.setValues(saved.values);
    form.clearErrors();
    setJustSaved(false);
  }

  const { bind, fieldErrors: errors } = form;
  const quotePreview = previewDocumentNumber(form.values.quotePrefix);
  const invoicePreview = previewDocumentNumber(form.values.invoicePrefix);

  return (
    <form id={form.id} noValidate onSubmit={handleSubmit}>
      <fieldset disabled={!canEdit} className="min-w-0 divide-y divide-zinc-200">
        <legend className="sr-only">Business settings</legend>

        <SettingsSection
          title="Business profile"
          description="How your business appears on quotes and invoices."
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Business name" error={errors.name} required className="sm:col-span-2">
              <Input {...bind('name')} autoComplete="organization" />
            </Field>
            <Field label="Contact email" error={errors.email}>
              <Input
                {...bind('email')}
                type="email"
                inputMode="email"
                autoComplete="email"
                autoCapitalize="none"
                spellCheck={false}
              />
            </Field>
            <Field label="Phone" error={errors.phone}>
              <Input {...bind('phone')} type="tel" autoComplete="tel" />
            </Field>
            <Field
              label="Website"
              hint="For example, example.com"
              error={errors.website}
              className="sm:col-span-2"
            >
              <Input
                {...bind('website')}
                inputMode="url"
                autoComplete="url"
                autoCapitalize="none"
                spellCheck={false}
              />
            </Field>
            <Field label="Address line 1" error={errors['address.line1']} className="sm:col-span-2">
              <Input {...bind('address.line1')} autoComplete="address-line1" />
            </Field>
            <Field label="Address line 2" error={errors['address.line2']} className="sm:col-span-2">
              <Input {...bind('address.line2')} autoComplete="address-line2" />
            </Field>
            <Field label="City" error={errors['address.city']}>
              <Input {...bind('address.city')} autoComplete="address-level2" />
            </Field>
            <Field label="State or region" error={errors['address.state']}>
              <Input {...bind('address.state')} autoComplete="address-level1" />
            </Field>
            <Field label="Postal code" error={errors['address.postalCode']}>
              <Input {...bind('address.postalCode')} autoComplete="postal-code" />
            </Field>
            <Field label="Country" error={errors['address.country']}>
              <Input {...bind('address.country')} autoComplete="country-name" />
            </Field>
          </div>
        </SettingsSection>

        <SettingsSection
          title="Branding"
          description="The accent color on your quotes and invoices."
        >
          <BrandColorField
            value={form.values.brandColor}
            savedValue={saved.values.brandColor}
            error={errors.brandColor}
            onChange={(value) => form.setValue('brandColor', value)}
          />
        </SettingsSection>

        <SettingsSection
          title="Regional"
          description="Currency and time zone for your documents and dates."
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <Field
              label="Currency"
              hint="Changes apply to new quotes and invoices only. Existing ones keep their currency."
              error={errors.currency}
            >
              <Select {...bind('currency')}>
                {CURRENCY_OPTIONS.map(({ value, label }) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Time zone" error={errors.timezone}>
              <Select {...bind('timezone')}>
                {timeZones.map(({ value, label }) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
        </SettingsSection>

        <SettingsSection
          title="Documents"
          description="Numbering and defaults for new quotes and invoices."
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <Field
              label="Quote number prefix"
              hint={quotePreview ? `Quotes are numbered like ${quotePreview}` : undefined}
              error={errors.quotePrefix}
            >
              <Input
                {...bind('quotePrefix')}
                autoCapitalize="characters"
                spellCheck={false}
                maxLength={TEXT_LIMITS.documentPrefix}
                className="uppercase"
              />
            </Field>
            <Field
              label="Invoice number prefix"
              hint={invoicePreview ? `Invoices are numbered like ${invoicePreview}` : undefined}
              error={errors.invoicePrefix}
            >
              <Input
                {...bind('invoicePrefix')}
                autoCapitalize="characters"
                spellCheck={false}
                maxLength={TEXT_LIMITS.documentPrefix}
                className="uppercase"
              />
            </Field>
            <Field
              label="Quotes are valid for"
              hint={`Days a customer has to accept (${QUOTE_VALIDITY_DAYS_RANGE.min}–${QUOTE_VALIDITY_DAYS_RANGE.max}).`}
              error={errors.quoteValidityDays}
            >
              <Input {...bind('quoteValidityDays')} inputMode="numeric" suffix="days" />
            </Field>
            <Field
              label="Invoice payment terms"
              hint={`Days until an invoice is due; ${INVOICE_DUE_DAYS_RANGE.min} means due on receipt.`}
              error={errors.invoiceDueDays}
            >
              <Input {...bind('invoiceDueDays')} inputMode="numeric" suffix="days" />
            </Field>
            <Field
              label="Default tax rate"
              hint="A percentage, pre-filled on new quotes and invoices."
              error={errors.defaultTaxRate}
            >
              <Input {...bind('defaultTaxRate')} inputMode="decimal" suffix="%" />
            </Field>
          </div>
        </SettingsSection>

        <SettingsSection
          title="Default text"
          description="Pre-filled on every new quote or invoice, and editable on each one."
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Quote notes" error={errors.defaultQuoteNotes}>
              <Textarea {...bind('defaultQuoteNotes')} maxLength={TEXT_LIMITS.notes} />
            </Field>
            <Field label="Quote terms" error={errors.defaultQuoteTerms}>
              <Textarea {...bind('defaultQuoteTerms')} maxLength={TEXT_LIMITS.terms} />
            </Field>
            <Field label="Invoice notes" error={errors.defaultInvoiceNotes}>
              <Textarea {...bind('defaultInvoiceNotes')} maxLength={TEXT_LIMITS.notes} />
            </Field>
            <Field label="Invoice terms" error={errors.defaultInvoiceTerms}>
              <Textarea {...bind('defaultInvoiceTerms')} maxLength={TEXT_LIMITS.terms} />
            </Field>
          </div>
        </SettingsSection>
      </fieldset>

      {canEdit && (
        <FormActionBar
          dirty={dirty}
          saving={updateBusiness.isPending}
          saved={justSaved}
          error={form.formError && `Your changes weren’t saved. ${form.formError}`}
          onDiscard={handleDiscard}
        />
      )}
    </form>
  );
}

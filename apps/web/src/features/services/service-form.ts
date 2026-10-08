import { type ServiceDto, type ServiceInput, serviceInputSchema } from '@quoteflow/shared';
import { type FormValidation, validateForm } from '@/lib/forms';

/**
 * Service fields as edited in the form. `price` holds integer minor units as
 * text ('' when empty) and `active` is 'true' or 'false', so every value fits
 * the string-only form state.
 */
export type ServiceFormValues = Record<
  'name' | 'description' | 'unit' | 'price' | 'active',
  string
>;

export function toServiceFormValues(
  service?: ServiceDto,
  defaults: Partial<ServiceInput> = {},
): ServiceFormValues {
  const price = service?.price ?? defaults.price;
  return {
    name: service?.name ?? defaults.name ?? '',
    description: service?.description ?? defaults.description ?? '',
    unit: service?.unit ?? defaults.unit ?? '',
    price: price === undefined ? '' : String(price),
    active: (service?.active ?? defaults.active ?? true) ? 'true' : 'false',
  };
}

/** The full service body, validated with the API's schema. Emptied text fields are cleared. */
export function buildServiceInput(values: ServiceFormValues): FormValidation<ServiceInput> {
  if (values.price.trim() === '') {
    const result = validateForm(serviceInputSchema, { ...values, price: 0, active: true });
    const fieldErrors = result.success ? {} : result.fieldErrors;
    return { success: false, fieldErrors: { ...fieldErrors, price: 'Enter a price' } };
  }
  return validateForm(serviceInputSchema, {
    name: values.name,
    description: values.description,
    unit: values.unit,
    price: Number(values.price),
    active: values.active === 'true',
  });
}

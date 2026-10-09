import { type CustomerDto, type CustomerInput, customerInputSchema } from '@quoteflow/shared';
import { type FormValidation, validateForm } from '@/lib/forms';

const ADDRESS_KEYS = ['line1', 'line2', 'city', 'state', 'postalCode', 'country'] as const;
type AddressKey = (typeof ADDRESS_KEYS)[number];

const TEXT_FIELDS = ['name', 'company', 'email', 'phone', 'notes'] as const;

/** Keys are the API's field paths, so server field errors map straight onto inputs. */
export type CustomerFormValues = Record<
  (typeof TEXT_FIELDS)[number] | `address.${AddressKey}`,
  string
>;

export function toCustomerFormValues(customer?: CustomerDto): CustomerFormValues {
  return {
    name: customer?.name ?? '',
    company: customer?.company ?? '',
    email: customer?.email ?? '',
    phone: customer?.phone ?? '',
    notes: customer?.notes ?? '',
    'address.line1': customer?.address.line1 ?? '',
    'address.line2': customer?.address.line2 ?? '',
    'address.city': customer?.address.city ?? '',
    'address.state': customer?.address.state ?? '',
    'address.postalCode': customer?.address.postalCode ?? '',
    'address.country': customer?.address.country ?? '',
  };
}

/**
 * The full customer body, validated with the API's schema. Every field is
 * sent, so on an edit a field emptied in the form ('') is cleared.
 */
export function buildCustomerInput(values: CustomerFormValues): FormValidation<CustomerInput> {
  const input = {
    ...Object.fromEntries(TEXT_FIELDS.map((field) => [field, values[field]])),
    address: Object.fromEntries(ADDRESS_KEYS.map((key) => [key, values[`address.${key}`]])),
  };
  return validateForm(customerInputSchema, input);
}

/** The address as display lines, e.g. "Austin, TX 78701"; empty parts are skipped. */
export function formatAddressLines(address: CustomerDto['address']): string[] {
  const region = [address.state, address.postalCode].filter(Boolean).join(' ');
  const locality = [address.city, region].filter(Boolean).join(', ');
  return [address.line1, address.line2, locality, address.country].filter((line): line is string =>
    Boolean(line),
  );
}

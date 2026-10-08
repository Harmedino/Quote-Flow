import { getErrorMessage, getFieldErrors, isApiError } from './api-error';

/** Error messages keyed by field path, e.g. `email` or `address.city`, matching input names. */
export type FieldErrors = Readonly<Partial<Record<string, string>>>;

interface SchemaIssue {
  readonly path: readonly PropertyKey[];
  readonly message: string;
}

/** What the form helpers need from a schema. Every Zod schema in `@quoteflow/shared` fits. */
export interface FormSchema<Output> {
  safeParse(
    value: unknown,
  ):
    { success: true; data: Output } | { success: false; error: { issues: readonly SchemaIssue[] } };
}

export type FormValidation<Output> =
  { success: true; data: Output } | { success: false; fieldErrors: FieldErrors };

/** Joins issue paths with dots and keeps the first message for each path. */
export function issuesToFieldErrors(issues: readonly SchemaIssue[]): FieldErrors {
  const fieldErrors: Record<string, string> = {};
  for (const { path, message } of issues) {
    fieldErrors[path.map(String).join('.')] ??= message;
  }
  return fieldErrors;
}

/**
 * Validates form values with the same schema the API uses, returning the
 * parsed (trimmed, normalised) data or field errors keyed by path.
 */
export function validateForm<Output>(
  schema: FormSchema<Output>,
  values: unknown,
): FormValidation<Output> {
  const result = schema.safeParse(values);
  return result.success
    ? { success: true, data: result.data }
    : { success: false, fieldErrors: issuesToFieldErrors(result.error.issues) };
}

export interface SubmitErrors {
  fieldErrors: FieldErrors;
  /** A message for the whole form, or null when every problem belongs to a field. */
  formError: string | null;
}

/** Only these responses carry per-field details (e.g. "An account with this email already exists"). */
const FIELD_DETAIL_CODES: ReadonlySet<string> = new Set(['VALIDATION_ERROR', 'CONFLICT']);

/**
 * Turns a failed submission into errors to display: server field details for
 * fields the form has go next to those fields; anything else (unknown paths,
 * wrong credentials, rate limits, network failures) becomes a form-level message.
 */
export function getSubmitErrors(error: unknown, formFields: Iterable<string>): SubmitErrors {
  const details =
    isApiError(error) && FIELD_DETAIL_CODES.has(error.code) ? getFieldErrors(error) : {};
  const known = new Set(formFields);
  const fieldErrors: Record<string, string> = {};
  let unmatched = Object.keys(details).length === 0;
  for (const [path, message] of Object.entries(details)) {
    if (known.has(path)) {
      fieldErrors[path] = message;
    } else {
      unmatched = true;
    }
  }
  return { fieldErrors, formError: unmatched ? getErrorMessage(error) : null };
}

/** Moves focus to the first control marked invalid, in document order. */
export function focusFirstInvalidField(container: ParentNode | null): boolean {
  const control = container?.querySelector<HTMLElement>('[aria-invalid="true"]');
  if (!control) {
    return false;
  }
  control.focus();
  return true;
}

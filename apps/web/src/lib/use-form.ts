import { type ChangeEvent, useEffect, useId, useState } from 'react';
import { focusFirstInvalidField, type SubmitErrors } from './forms';

type FormValues = Record<string, string>;

type ControlElement = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

interface ErrorState extends SubmitErrors {
  /** Bumped on every failed submit, so focus moves to the first invalid field each time. */
  attempt: number;
}

const NO_ERRORS: ErrorState = { fieldErrors: {}, formError: null, attempt: 0 };

/**
 * Minimal controlled-form state: string values keyed by input name (the field
 * path, e.g. `address.city`), field and form-level errors, and focus on the
 * first invalid field after a failed submit. Editing a field clears its error.
 * Give the <form> the returned `id`; it is how the first invalid field is found.
 */
export function useForm<Values extends FormValues>(initialValues: Values | (() => Values)) {
  const id = useId();
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState<ErrorState>(NO_ERRORS);

  useEffect(() => {
    if (errors.attempt > 0) {
      focusFirstInvalidField(document.getElementById(id));
    }
  }, [errors.attempt, id]);

  function setValue(name: keyof Values & string, value: string) {
    setValues((current) => ({ ...current, [name]: value }));
    setErrors((current) => {
      if (current.fieldErrors[name] === undefined) {
        return current;
      }
      const { [name]: _cleared, ...fieldErrors } = current.fieldErrors;
      return { ...current, fieldErrors };
    });
  }

  /** Props that connect an Input, Select or Textarea to a value. */
  function bind(name: keyof Values & string) {
    return {
      name,
      value: values[name],
      onChange: (event: ChangeEvent<ControlElement>) => setValue(name, event.target.value),
    };
  }

  function showErrors({ fieldErrors = {}, formError = null }: Partial<SubmitErrors>) {
    setErrors((current) => ({ fieldErrors, formError, attempt: current.attempt + 1 }));
  }

  function clearErrors() {
    setErrors((current) => ({ ...NO_ERRORS, attempt: current.attempt }));
  }

  return {
    id,
    values,
    setValues,
    setValue,
    bind,
    fieldErrors: errors.fieldErrors,
    formError: errors.formError,
    showErrors,
    clearErrors,
  };
}

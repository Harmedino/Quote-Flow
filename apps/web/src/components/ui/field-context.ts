import { type AriaAttributes, createContext, useContext } from 'react';
import { cn } from '@/lib/cn';

interface FieldControlContextValue {
  id: string;
  describedBy: string | undefined;
  invalid: boolean;
  required: boolean;
}

export const FieldControlContext = createContext<FieldControlContextValue | null>(null);

interface ControlAccessibilityProps {
  id?: string;
  'aria-describedby'?: string;
  'aria-invalid'?: AriaAttributes['aria-invalid'];
  'aria-required'?: AriaAttributes['aria-required'];
}

/**
 * Connects a form control to its enclosing <Field>: the field's id (so the
 * label works), hint/error descriptions, and invalid/required state.
 */
export function useFieldControlProps<P extends ControlAccessibilityProps>(props: P): P {
  const field = useContext(FieldControlContext);
  if (!field) {
    return props;
  }
  return {
    ...props,
    id: field.id,
    'aria-describedby': cn(field.describedBy, props['aria-describedby']) || undefined,
    'aria-invalid': props['aria-invalid'] ?? (field.invalid || undefined),
    'aria-required': props['aria-required'] ?? (field.required || undefined),
  };
}

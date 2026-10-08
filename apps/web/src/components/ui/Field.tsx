import { CircleAlert } from 'lucide-react';
import { type ReactNode, useId } from 'react';
import { cn } from '@/lib/cn';
import { FieldControlContext } from './field-context';

export interface FieldProps {
  label: ReactNode;
  hint?: ReactNode;
  error?: string;
  required?: boolean;
  /** Id for the control; generated when omitted. Set it here rather than on the control. */
  id?: string;
  className?: string;
  /** A single Input, Textarea or Select. */
  children: ReactNode;
}

export function Field({
  label,
  hint,
  error,
  required = false,
  id,
  className,
  children,
}: FieldProps) {
  const generatedId = useId();
  const controlId = id ?? generatedId;
  const hintId = hint ? `${controlId}-hint` : undefined;
  const errorId = error ? `${controlId}-error` : undefined;

  return (
    <div className={cn('space-y-1.5', className)}>
      <label htmlFor={controlId} className="block text-sm font-medium text-zinc-900">
        {label}
        {required && (
          <span aria-hidden="true" className="ml-0.5 text-red-600">
            *
          </span>
        )}
      </label>
      <FieldControlContext
        value={{
          id: controlId,
          describedBy: cn(hintId, errorId) || undefined,
          invalid: Boolean(error),
          required,
        }}
      >
        {children}
      </FieldControlContext>
      {hint && (
        <p id={hintId} className="text-sm text-zinc-500">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="flex items-start gap-1.5 text-sm text-red-700">
          <CircleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}

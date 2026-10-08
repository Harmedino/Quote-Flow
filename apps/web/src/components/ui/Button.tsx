import type { ComponentProps } from 'react';
import { type ButtonStyleProps, buttonClasses } from './button-styles';
import { Spinner } from './Spinner';

export interface ButtonProps extends ComponentProps<'button'>, ButtonStyleProps {
  /** Shows a spinner and disables the button while an action is in progress. */
  loading?: boolean;
}

export function Button({
  variant,
  size,
  loading = false,
  disabled,
  type = 'button',
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={buttonClasses({ variant, size, className })}
      {...props}
    >
      {loading && <Spinner />}
      {children}
    </button>
  );
}

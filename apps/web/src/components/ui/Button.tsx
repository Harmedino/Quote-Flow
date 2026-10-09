import type { ComponentProps } from 'react';
import { type ButtonStyleProps, buttonClasses } from './button-styles';
import { Spinner } from './Spinner';

export interface ButtonProps extends ComponentProps<'button'>, ButtonStyleProps {
  /**
   * Shows a spinner and ignores clicks while an action is in progress. Unlike
   * native `disabled`, the button keeps keyboard focus.
   */
  loading?: boolean;
}

/**
 * `aria-disabled` (without `disabled`) styles the button as unavailable but keeps
 * it focusable; its clicks still fire, so the handler must ignore them.
 */
export function Button({
  variant,
  size,
  loading = false,
  disabled,
  'aria-disabled': ariaDisabled,
  type = 'button',
  className,
  onClick,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled}
      aria-disabled={loading || ariaDisabled || undefined}
      aria-busy={loading || undefined}
      className={buttonClasses({ variant, size, className })}
      onClick={(event) => {
        // Implicit form submission clicks the default button too, so this also blocks resubmits.
        if (loading) {
          event.preventDefault();
          return;
        }
        onClick?.(event);
      }}
      {...props}
    >
      {loading && <Spinner />}
      {children}
    </button>
  );
}

import type { ComponentProps } from 'react';
import { cn } from '@/lib/cn';
import { type ButtonStyleProps, buttonClasses } from './button-styles';

export interface ButtonProps extends ComponentProps<'button'>, ButtonStyleProps {
  /**
   * Runs a strip of the hazard tape along the bottom edge (Signal's only working indicator) and
   * ignores clicks while an action is in progress. Unlike native `disabled`, the button keeps
   * keyboard focus.
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
  shape,
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
      className={buttonClasses({
        variant,
        size,
        shape,
        className: cn(loading && 'relative overflow-hidden', className),
      })}
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
      {loading && (
        <span
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 h-[3px] animate-hazard-scroll hazard-tape"
        />
      )}
      {children}
    </button>
  );
}

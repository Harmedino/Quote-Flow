import type { ComponentProps } from 'react';
import { Link } from 'react-router';
import { type ButtonStyleProps, buttonClasses } from './button-styles';

export type ButtonLinkProps = ComponentProps<typeof Link> & ButtonStyleProps;

/** A router link styled as a button, for navigation that should look like an action. */
export function ButtonLink({ variant, size, shape, className, ...props }: ButtonLinkProps) {
  return <Link className={buttonClasses({ variant, size, shape, className })} {...props} />;
}

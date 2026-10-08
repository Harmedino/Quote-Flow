import type { ComponentProps } from 'react';
import { cn } from '@/lib/cn';
import { CONTROL_CLASSES } from './control-styles';
import { useFieldControlProps } from './field-context';

export function Input({ className, ...props }: ComponentProps<'input'>) {
  const controlProps = useFieldControlProps(props);
  return <input className={cn(CONTROL_CLASSES, 'h-10', className)} {...controlProps} />;
}

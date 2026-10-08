import type { ComponentProps } from 'react';
import { cn } from '@/lib/cn';
import { CONTROL_CLASSES } from './control-styles';
import { useFieldControlProps } from './field-context';

export function Textarea({ className, rows = 4, ...props }: ComponentProps<'textarea'>) {
  const controlProps = useFieldControlProps(props);
  return (
    <textarea rows={rows} className={cn(CONTROL_CLASSES, 'py-2', className)} {...controlProps} />
  );
}

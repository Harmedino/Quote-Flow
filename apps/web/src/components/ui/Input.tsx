import type { ComponentProps } from 'react';
import { cn } from '@/lib/cn';
import { CONTROL_CLASSES } from './control-styles';
import { useFieldControlProps } from './field-context';

export interface InputProps extends ComponentProps<'input'> {
  /**
   * A short unit shown inside the end of the input, e.g. "days" or "%". It is
   * hidden from assistive technology, so the label or hint must name the unit.
   */
  suffix?: string;
}

export function Input({ className, suffix, ...props }: InputProps) {
  const controlProps = useFieldControlProps(props);
  if (!suffix) {
    return <input className={cn(CONTROL_CLASSES, 'h-10', className)} {...controlProps} />;
  }
  return (
    <div className="relative">
      <input className={cn(CONTROL_CLASSES, 'h-10 pr-14', className)} {...controlProps} />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-stone-500"
      >
        {suffix}
      </span>
    </div>
  );
}

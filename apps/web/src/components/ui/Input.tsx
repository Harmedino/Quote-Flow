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
    return <input className={cn(CONTROL_CLASSES, 'h-10.5', className)} {...controlProps} />;
  }
  // Room for the suffix: its inset, half a rem per mono character and a gap before the value.
  const suffixRoom = `${1.5 + suffix.length * 0.5}rem`;
  return (
    <div className="relative">
      <input
        className={cn(CONTROL_CLASSES, 'h-10.5', className)}
        {...controlProps}
        style={{ ...controlProps.style, paddingRight: suffixRoom }}
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 right-3 flex items-center font-mono text-[12.5px] font-medium text-muted"
      >
        {suffix}
      </span>
    </div>
  );
}

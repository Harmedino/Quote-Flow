import { ChevronDown } from 'lucide-react';
import type { ComponentProps } from 'react';
import { cn } from '@/lib/cn';
import { CONTROL_CLASSES } from './control-styles';
import { useFieldControlProps } from './field-context';

/**
 * A styled native <select>, which keeps the platform's accessible picker on
 * every device. `className` applies to the wrapper (width, spacing).
 */
export function Select({ className, ...props }: ComponentProps<'select'>) {
  const controlProps = useFieldControlProps(props);
  return (
    <div className={cn('relative', className)}>
      <select className={cn(CONTROL_CLASSES, 'h-10 appearance-none pr-9')} {...controlProps} />
      <ChevronDown
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-zinc-500"
      />
    </div>
  );
}

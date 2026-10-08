import { Eye, EyeOff } from 'lucide-react';
import { type ComponentProps, useContext, useState } from 'react';
import { cn } from '@/lib/cn';
import { FieldControlContext } from './field-context';
import { Input } from './Input';

export type PasswordInputProps = Omit<ComponentProps<'input'>, 'type'>;

/**
 * A password input with a show/hide toggle. The toggle is a pressed/unpressed
 * button with a constant name, as assistive technology expects for toggles.
 * `className` applies to the wrapper.
 */
export function PasswordInput({ className, ...props }: PasswordInputProps) {
  const [visible, setVisible] = useState(false);
  const field = useContext(FieldControlContext);

  return (
    <div className={cn('relative', className)}>
      <Input
        {...props}
        type={visible ? 'text' : 'password'}
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        className="pr-11"
      />
      <button
        type="button"
        onClick={() => setVisible((current) => !current)}
        aria-pressed={visible}
        aria-controls={field?.id}
        className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-lg text-zinc-500 transition-colors hover:text-zinc-900 focus-visible:outline-offset-[-2px]"
      >
        {visible ? (
          <EyeOff aria-hidden="true" className="size-[18px]" />
        ) : (
          <Eye aria-hidden="true" className="size-[18px]" />
        )}
        <span className="sr-only">Show password</span>
      </button>
    </div>
  );
}

import { useState } from 'react';
import { CONTROL_CLASSES } from '@/components/ui/control-styles';
import { cn } from '@/lib/cn';
import { parseQuantityInput } from './line-item-inputs';

export interface QuantityInputProps {
  id: string;
  value: number | null;
  onChange: (value: number | null) => void;
  invalid?: boolean;
  describedBy?: string;
  className?: string;
}

/** A decimal field that keeps what is typed ("1.") while focused and reports a number. */
export function QuantityInput({
  id,
  value,
  onChange,
  invalid,
  describedBy,
  className,
}: QuantityInputProps) {
  const [text, setText] = useState('');
  const [editing, setEditing] = useState(false);
  const shown = editing ? text : value === null ? '' : String(value);

  return (
    <input
      id={id}
      type="text"
      inputMode="decimal"
      autoComplete="off"
      aria-invalid={invalid || undefined}
      aria-describedby={describedBy}
      className={cn(CONTROL_CLASSES, 'h-10 text-right tabular-nums', className)}
      value={shown}
      onFocus={(event) => {
        setText(value === null ? '' : String(value));
        setEditing(true);
        event.currentTarget.select();
      }}
      onChange={(event) => {
        setText(event.target.value);
        const parsed = parseQuantityInput(event.target.value);
        if (parsed !== undefined) onChange(parsed);
      }}
      onBlur={() => setEditing(false)}
    />
  );
}

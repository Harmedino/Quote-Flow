import type { CurrencyCode } from '@quoteflow/shared';
import { useState } from 'react';
import { cn } from '@/lib/cn';
import { currencySymbol, formatMoneyInput, parseMoneyInput } from '@/lib/money-input';
import { Input, type InputProps } from './Input';

export interface MoneyInputProps extends Omit<InputProps, 'value' | 'onChange' | 'type'> {
  /** Amount in minor units, or null when empty. */
  value: number | null;
  onChange: (value: number | null) => void;
  currency: CurrencyCode;
}

/**
 * A decimal amount field that reports integer minor units. While focused it
 * keeps the text exactly as typed; on blur it shows the amount grouped
 * (12,500,000.00) so long figures read correctly at a glance.
 */
export function MoneyInput({
  value,
  onChange,
  currency,
  onBlur,
  className,
  ...props
}: MoneyInputProps) {
  const [text, setText] = useState(() => formatMoneyInput(value, currency, { grouped: false }));
  const [editing, setEditing] = useState(false);
  const shown = editing ? text : formatMoneyInput(value, currency, { grouped: true });

  return (
    <Input
      {...props}
      type="text"
      inputMode="decimal"
      autoComplete="off"
      suffix={currencySymbol(currency)}
      // Amounts are set like a till slip, so digits line up while typing.
      className={cn('font-mono tabular-nums', className)}
      value={shown}
      onFocus={() => {
        setText(formatMoneyInput(value, currency, { grouped: false }));
        setEditing(true);
      }}
      onChange={(event) => {
        setText(event.target.value);
        const parsed = parseMoneyInput(event.target.value, currency);
        if (parsed !== undefined) onChange(parsed);
      }}
      onBlur={(event) => {
        setEditing(false);
        onBlur?.(event);
      }}
    />
  );
}

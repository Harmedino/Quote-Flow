import { type CurrencyCode, fromMinorUnits, getCurrencyMinorUnits } from '@quoteflow/shared';
import { useState } from 'react';
import { parseMoneyInput } from '@/lib/money-input';
import { Input, type InputProps } from './Input';

export interface MoneyInputProps extends Omit<InputProps, 'value' | 'onChange' | 'type'> {
  /** Amount in minor units, or null when empty. */
  value: number | null;
  onChange: (value: number | null) => void;
  currency: CurrencyCode;
}

function formatForEditing(value: number | null, currency: CurrencyCode): string {
  if (value === null) return '';
  return fromMinorUnits(value, currency).toFixed(getCurrencyMinorUnits(currency));
}

/**
 * A decimal amount field that reports integer minor units. While focused it
 * keeps the text exactly as typed; on blur it normalises the display.
 */
export function MoneyInput({ value, onChange, currency, onBlur, ...props }: MoneyInputProps) {
  const [text, setText] = useState(() => formatForEditing(value, currency));
  const [editing, setEditing] = useState(false);
  const shown = editing ? text : formatForEditing(value, currency);

  return (
    <Input
      {...props}
      type="text"
      inputMode="decimal"
      autoComplete="off"
      suffix={currency}
      value={shown}
      onFocus={() => {
        setText(formatForEditing(value, currency));
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

import { DEFAULT_BRAND_COLOR } from '@quoteflow/shared';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { pickerColor } from '@/features/business/business-form';

export interface BrandColorFieldProps {
  value: string;
  /** Shown in the picker while the typed value is not a complete hex color. */
  savedValue: string;
  error?: string;
  onChange: (value: string) => void;
}

/** A native color picker and a hex text field that edit the same value. */
export function BrandColorField({ value, savedValue, error, onChange }: BrandColorFieldProps) {
  return (
    <Field
      label="Brand color"
      hint={`Pick a color or type its hex code, such as ${DEFAULT_BRAND_COLOR}.`}
      error={error}
    >
      <div className="flex items-center gap-3">
        <input
          type="color"
          value={pickerColor(value, savedValue)}
          onChange={(event) => onChange(event.target.value)}
          aria-label="Pick brand color"
          className="h-10 w-14 shrink-0 cursor-pointer rounded-lg border border-zinc-500/80 bg-white p-1 shadow-xs disabled:cursor-not-allowed disabled:opacity-60 [&::-moz-color-swatch]:rounded-md [&::-moz-color-swatch]:border-0 [&::-webkit-color-swatch]:rounded-md [&::-webkit-color-swatch]:border-0 [&::-webkit-color-swatch-wrapper]:p-0"
        />
        <Input
          name="brandColor"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          maxLength={7}
          autoCapitalize="none"
          autoComplete="off"
          spellCheck={false}
          className="max-w-36 font-mono"
        />
      </div>
    </Field>
  );
}

import { DEFAULT_BRAND_COLOR } from '@quoteflow/shared';
import { Check } from 'lucide-react';
import { useId } from 'react';
import { brandColorVars, textColorOn } from '@/components/documents/brand-color';
import { businessInitials } from '@/components/documents/document-format';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { pickerColor } from '@/features/business/business-form';
import { cn } from '@/lib/cn';

/** Colors an owner can pick with one tap; any hex color works too. */
const PRESETS = [
  { name: 'Near black', hex: '#0c1a14' },
  { name: 'Green', hex: '#0f8250' },
  { name: 'Teal', hex: '#0f766e' },
  { name: 'Blue', hex: '#1d4ed8' },
  { name: 'Violet', hex: '#6d28d9' },
  { name: 'Pink', hex: '#be185d' },
  { name: 'Red', hex: '#b91c1c' },
  { name: 'Orange', hex: '#c2410c' },
] as const;

export interface BrandColorFieldProps {
  value: string;
  /** Shown in the picker and preview while the typed value is not a complete hex color. */
  savedValue: string;
  /** For the preview of what customers see. */
  businessName: string;
  error?: string;
  onChange: (value: string) => void;
}

/** Preset swatches, a native color picker and a hex text field that edit the same value. */
export function BrandColorField({
  value,
  savedValue,
  businessName,
  error,
  onChange,
}: BrandColorFieldProps) {
  const groupLabelId = useId();
  const shown = pickerColor(value, savedValue);
  const selected = value.trim().toLowerCase();

  return (
    <div className="space-y-5">
      <div role="group" aria-labelledby={groupLabelId} className="space-y-2.5">
        <p id={groupLabelId} className="text-sm font-medium text-stone-800">
          Brand color
        </p>
        <div className="flex flex-wrap items-center gap-2.5">
          {PRESETS.map((preset) => {
            const active = selected === preset.hex;
            return (
              <button
                key={preset.hex}
                type="button"
                aria-pressed={active}
                aria-label={`${preset.name}, ${preset.hex}`}
                title={preset.name}
                onClick={() => onChange(preset.hex)}
                style={{ backgroundColor: preset.hex, color: textColorOn(preset.hex) }}
                className={cn(
                  // The faint border keeps dark swatches visible on the dark surface.
                  'flex size-9 items-center justify-center rounded-full border border-black/10 ring-offset-2 ring-offset-surface transition disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/20',
                  active ? 'ring-2 ring-stone-900' : 'enabled:hover:scale-110',
                )}
              >
                {active && <Check aria-hidden="true" className="size-4" strokeWidth={3} />}
              </button>
            );
          })}
          <label className="relative inline-flex h-9 cursor-pointer items-center gap-2 rounded-full border border-stone-300 bg-surface px-3 text-sm font-medium text-stone-700 transition-colors has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-brand-500 hover:bg-stone-50 has-disabled:cursor-not-allowed has-disabled:opacity-60">
            <span
              aria-hidden="true"
              className="size-4 rounded-full border border-stone-300"
              style={{ backgroundColor: shown }}
            />
            Custom
            <input
              type="color"
              value={shown}
              onChange={(event) => onChange(event.target.value)}
              aria-label="Pick any color"
              className="absolute inset-0 size-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
            />
          </label>
        </div>
      </div>

      <Field
        label="Hex code"
        hint={`Or type a color’s hex code, such as ${DEFAULT_BRAND_COLOR}.`}
        error={error}
      >
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
      </Field>

      <BrandPreview color={shown} businessName={businessName} />
    </div>
  );
}

/** A miniature of the customer's quote page, so the owner sees the color in use. */
function BrandPreview({ color, businessName }: { color: string; businessName: string }) {
  return (
    <div>
      <p className="section-label">How customers see it</p>
      <div
        aria-hidden="true"
        style={brandColorVars(color)}
        className="mt-2 overflow-hidden rounded-xl border border-stone-200 bg-surface-muted"
      >
        <div className="h-1.5 bg-(--doc-accent)" />
        <div className="flex items-center gap-3 p-4">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-(--doc-accent) font-display text-sm font-bold text-(--doc-on-accent)">
            {businessInitials(businessName)}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-stone-900">{businessName}</p>
            <p className="text-xs text-stone-500">Your quote</p>
          </div>
          <span className="inline-flex h-8 shrink-0 items-center rounded-lg bg-(--doc-accent) px-3 text-xs font-semibold text-(--doc-on-accent)">
            Accept quote
          </span>
        </div>
      </div>
    </div>
  );
}

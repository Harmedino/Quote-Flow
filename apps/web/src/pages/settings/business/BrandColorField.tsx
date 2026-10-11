import { DEFAULT_BRAND_COLOR } from '@quoteflow/shared';
import { Check } from 'lucide-react';
import { useId } from 'react';
import { textColorOn } from '@/components/documents/brand-color';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { pickerColor } from '@/features/business/business-form';
import { cn } from '@/lib/cn';
import { BrandPreview } from './BrandPreview';

/**
 * Colours an owner can pick with one tap; any hex colour works too. Signal navy (the default)
 * comes first. The older presets stay, so a business that saved one still sees it selected.
 */
const PRESETS = [
  { name: 'Navy', hex: DEFAULT_BRAND_COLOR },
  { name: 'Lagoon', hex: '#0f6b78' },
  { name: 'Teal', hex: '#0f766e' },
  { name: 'Green', hex: '#0f8250' },
  { name: 'Blue', hex: '#1d4ed8' },
  { name: 'Violet', hex: '#6d28d9' },
  { name: 'Pink', hex: '#be185d' },
  { name: 'Red', hex: '#b91c1c' },
  { name: 'Orange', hex: '#c2410c' },
  { name: 'Marigold', hex: '#f5a524' },
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
        <p id={groupLabelId} className="text-sm font-semibold text-ink">
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
                  // The faint inner edge keeps dark swatches visible on the dark surface.
                  'flex size-9 items-center justify-center rounded-[9px] inset-ring inset-ring-ink/30 ring-offset-2 ring-offset-surface transition disabled:cursor-not-allowed disabled:opacity-60',
                  active ? 'ring-2 ring-ink' : 'enabled:hover:scale-110',
                )}
              >
                {active && <Check aria-hidden="true" className="size-4" strokeWidth={3} />}
              </button>
            );
          })}
          <label className="relative inline-flex h-9 cursor-pointer items-center gap-2 rounded-[9px] bg-surface px-3 text-sm font-semibold text-ink-2 shadow-[inset_0_0_0_1px_var(--color-line-strong)] transition-colors has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-focus hover:bg-surface-muted has-disabled:cursor-not-allowed has-disabled:opacity-60">
            <span
              aria-hidden="true"
              className="size-4 rounded-[4px] inset-ring inset-ring-ink/20"
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

      {/* From `lg` the preview sits in the rail beside the form instead. */}
      <BrandPreview color={shown} businessName={businessName} className="lg:hidden" />
    </div>
  );
}

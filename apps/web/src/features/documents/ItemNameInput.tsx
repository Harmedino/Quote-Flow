import type { CurrencyCode, ServiceDto } from '@quoteflow/shared';
import { type Ref, useId, useState } from 'react';
import { CONTROL_CLASSES } from '@/components/ui/control-styles';
import { cn } from '@/lib/cn';
import { formatMoney } from '@/lib/format';
import { matchServices } from './line-item-inputs';
import { useListbox } from './use-listbox';

export interface ItemNameInputProps {
  id: string;
  value: string;
  onChange: (name: string) => void;
  onSelectService: (service: ServiceDto) => void;
  services: readonly ServiceDto[];
  currency: CurrencyCode;
  invalid?: boolean;
  describedBy?: string;
  inputRef?: Ref<HTMLInputElement>;
}

/** Item name with suggestions from the service catalogue; any free text is allowed too. */
export function ItemNameInput({
  id,
  value,
  onChange,
  onSelectService,
  services,
  currency,
  invalid,
  describedBy,
  inputRef,
}: ItemNameInputProps) {
  const listboxId = useId();
  const [open, setOpen] = useState(false);
  const suggestions = open ? matchServices(services, value) : [];
  const expanded = open && suggestions.length > 0;

  function select(service: ServiceDto) {
    onSelectService(service);
    setOpen(false);
  }

  const listbox = useListbox({
    options: suggestions,
    open,
    onOpenChange: setOpen,
    onSelect: select,
  });
  const optionId = (index: number) => `${listboxId}-option-${index}`;

  return (
    <div className="relative">
      <input
        ref={inputRef}
        id={id}
        type="text"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={expanded}
        aria-controls={listboxId}
        aria-activedescendant={listbox.activeIndex >= 0 ? optionId(listbox.activeIndex) : undefined}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        autoComplete="off"
        placeholder={services.length > 0 ? 'Search services or type an item' : 'Item name'}
        className={cn(CONTROL_CLASSES, 'h-10')}
        value={value}
        onChange={(event) => {
          onChange(event.target.value);
          setOpen(true);
          listbox.setActiveIndex(-1);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={listbox.onKeyDown}
      />
      <ul
        id={listboxId}
        role="listbox"
        aria-label="Services"
        hidden={!expanded}
        className="absolute inset-x-0 top-full z-30 mt-1 max-h-72 overflow-auto rounded-lg border border-zinc-200 bg-white py-1 shadow-lg ring-1 ring-zinc-950/5"
      >
        {suggestions.map((service, index) => (
          <li
            key={service.id}
            id={optionId(index)}
            role="option"
            aria-selected={index === listbox.activeIndex}
            // Keeps focus in the input, so the blur handler does not close the list first.
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => select(service)}
            onMouseMove={() => listbox.setActiveIndex(index)}
            className={cn(
              'flex cursor-pointer items-baseline justify-between gap-3 px-3 py-2 text-sm',
              index === listbox.activeIndex ? 'bg-brand-50 text-brand-900' : 'text-zinc-900',
            )}
          >
            <span className="min-w-0 truncate font-medium">{service.name}</span>
            <span className="shrink-0 text-zinc-500 tabular-nums">
              {formatMoney(service.price, currency)}
              {service.unit ? ` / ${service.unit}` : ''}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

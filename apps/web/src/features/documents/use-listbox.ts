import { type KeyboardEvent, useState } from 'react';

interface ListboxOptions<T> {
  options: readonly T[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (option: T) => void;
}

/**
 * Keyboard behaviour for a combobox input with a popup listbox (WAI-ARIA
 * combobox pattern): arrows move the active option, Enter picks it, Escape
 * closes. Focus stays in the input; the active option is announced through
 * aria-activedescendant.
 */
export function useListbox<T>({ options, open, onOpenChange, onSelect }: ListboxOptions<T>) {
  const [activeIndex, setActiveIndex] = useState(-1);
  const active = open && activeIndex >= 0 && activeIndex < options.length ? activeIndex : -1;

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (!open) {
        onOpenChange(true);
        setActiveIndex(event.key === 'ArrowDown' ? 0 : options.length - 1);
        return;
      }
      if (options.length === 0) return;
      const step = event.key === 'ArrowDown' ? 1 : -1;
      setActiveIndex((active + step + options.length) % options.length);
    } else if (event.key === 'Enter' && open && active >= 0) {
      event.preventDefault();
      const option = options[active];
      if (option !== undefined) onSelect(option);
      setActiveIndex(-1);
    } else if (event.key === 'Escape' && open) {
      event.preventDefault();
      onOpenChange(false);
      setActiveIndex(-1);
    } else if (event.key === 'Tab' && open) {
      onOpenChange(false);
    }
  }

  return { activeIndex: active, setActiveIndex, onKeyDown };
}

import { Search, X } from 'lucide-react';
import { useEffect, useEffectEvent, useRef, useState } from 'react';
import { CONTROL_CLASSES } from '@/components/ui/control-styles';
import { cn } from '@/lib/cn';
import { useDebouncedValue } from '@/lib/use-debounced-value';

export interface ListSearchProps {
  /** The applied search (e.g. from the URL). Changes from outside replace the typed text. */
  value: string;
  /** Called with the trimmed text once typing pauses. */
  onSearch: (search: string) => void;
  /** Accessible name of the field, e.g. "Search customers". */
  label: string;
  placeholder?: string;
  className?: string;
}

/** A search box for lists that applies what is typed after a short pause. */
export function ListSearch({ value, onSearch, label, placeholder, className }: ListSearchProps) {
  const [text, setText] = useState(value);
  const [appliedValue, setAppliedValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounced = useDebouncedValue(text, 300);
  const lastSent = useRef(value);

  // Back/forward navigation or a "clear search" link changes the value from outside.
  if (value !== appliedValue) {
    setAppliedValue(value);
    if (value !== text.trim()) setText(value);
  }

  useEffect(() => {
    lastSent.current = value;
  }, [value]);

  function apply(search: string) {
    if (search !== lastSent.current) {
      lastSent.current = search;
      onSearch(search);
    }
  }

  const applyDebounced = useEffectEvent(apply);

  useEffect(() => {
    applyDebounced(debounced.trim());
  }, [debounced]);

  return (
    <div role="search" className={cn('relative', className)}>
      <Search
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-zinc-500"
      />
      <input
        ref={inputRef}
        type="search"
        aria-label={label}
        placeholder={placeholder}
        value={text}
        onChange={(event) => setText(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') apply(text.trim());
        }}
        autoComplete="off"
        spellCheck={false}
        className={cn(
          CONTROL_CLASSES,
          'h-10 pr-10 pl-9 [&::-webkit-search-cancel-button]:appearance-none',
        )}
      />
      {text && (
        <button
          type="button"
          onClick={() => {
            setText('');
            apply('');
            inputRef.current?.focus();
          }}
          className="absolute top-1/2 right-1.5 inline-flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
        >
          <X aria-hidden="true" className="size-4" />
          <span className="sr-only">Clear search</span>
        </button>
      )}
    </div>
  );
}

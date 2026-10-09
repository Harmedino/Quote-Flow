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
  const [seenDebounced, setSeenDebounced] = useState(debounced);
  // The search last sent from here (or taken from outside). When `value` catches up with it, the
  // text typed in the meantime stays; any other new value replaces the text.
  const [expected, setExpected] = useState(value);
  const lastSent = useRef(value);

  let latestExpected = expected;
  if (debounced !== seenDebounced) {
    // The effect below sends it.
    setSeenDebounced(debounced);
    latestExpected = debounced.trim();
    setExpected(latestExpected);
  }
  if (value !== appliedValue) {
    setAppliedValue(value);
    if (value !== latestExpected) {
      // Back/forward navigation or a "Clear filters" button changed it from outside.
      setExpected(value);
      if (value !== text.trim()) setText(value);
    }
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

  /** Applies a search straight away, from Enter or the clear button. */
  function applyNow(search: string) {
    setExpected(search);
    apply(search);
  }

  const applyDebounced = useEffectEvent(apply);

  useEffect(() => {
    applyDebounced(debounced.trim());
  }, [debounced]);

  return (
    <div role="search" className={cn('relative', className)}>
      <Search
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-stone-500"
      />
      <input
        ref={inputRef}
        type="search"
        aria-label={label}
        placeholder={placeholder}
        value={text}
        onChange={(event) => setText(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') applyNow(text.trim());
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
            applyNow('');
            inputRef.current?.focus();
          }}
          className="absolute top-1/2 right-1.5 inline-flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-stone-500 transition-colors hover:bg-stone-100 hover:text-stone-900"
        >
          <X aria-hidden="true" className="size-4" />
          <span className="sr-only">Clear search</span>
        </button>
      )}
    </div>
  );
}

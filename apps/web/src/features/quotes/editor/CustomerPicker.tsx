import type { CustomerDto } from '@quoteflow/shared';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { CircleAlert, Mail, MapPin, Phone, Search, UserPlus } from 'lucide-react';
import { type Ref, useEffect, useId, useRef, useState } from 'react';
import { formatAddressLines } from '@/components/documents/document-format';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { CONTROL_CLASSES } from '@/components/ui/control-styles';
import { Spinner } from '@/components/ui/Spinner';
import { CustomerFormDialog } from '@/features/customers/CustomerFormDialog';
import { listCustomers } from '@/features/customers/customers-api';
import { customerKeys } from '@/features/customers/use-customers';
import { useListbox } from '@/features/documents/use-listbox';
import { cn } from '@/lib/cn';
import {
  customerSummaryLine,
  type SelectedCustomer,
  selectedCustomerFromDto,
} from './selected-customer';
import { useDebouncedValue } from './use-debounced-value';

const SEARCH_PAGE_SIZE = 8;

export interface CustomerPickerProps {
  customer: SelectedCustomer | null;
  onChange: (customer: SelectedCustomer) => void;
  error?: string;
  /** Id of the search input, so form errors can focus it. */
  inputId: string;
}

function SelectedCustomerCard({
  customer,
  onChange,
  changeButtonRef,
}: {
  customer: SelectedCustomer;
  onChange: () => void;
  changeButtonRef: Ref<HTMLButtonElement>;
}) {
  const address = formatAddressLines(customer.address).join(', ');
  const details = [
    customer.email && { icon: Mail, text: customer.email },
    customer.phone && { icon: Phone, text: customer.phone },
    address && { icon: MapPin, text: address },
  ].filter((detail) => detail !== '' && detail !== null);
  return (
    <div className="rounded-xl border border-zinc-200 bg-zinc-50/60 p-4">
      <div className="flex items-center gap-3">
        <Avatar name={customer.name} />
        <div className="min-w-0 flex-1 text-sm">
          <p className="truncate font-semibold text-zinc-950">{customer.name}</p>
          {customer.company && <p className="truncate text-zinc-600">{customer.company}</p>}
        </div>
        <Button ref={changeButtonRef} variant="ghost" size="sm" onClick={onChange}>
          Change
        </Button>
      </div>
      {details.length > 0 && (
        <ul className="mt-3 flex flex-col gap-1.5 text-sm text-zinc-600 sm:flex-row sm:flex-wrap sm:gap-x-5 sm:pl-12">
          {details.map(({ icon: Icon, text }) => (
            <li key={text} className="flex min-w-0 items-start gap-2">
              <Icon aria-hidden="true" className="mt-0.5 size-3.5 shrink-0 text-zinc-400" />
              <span className="wrap-anywhere">{text}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Searchable, keyboard-accessible customer combobox with inline customer creation. */
export function CustomerPicker({ customer, onChange, error, inputId }: CustomerPickerProps) {
  const [searching, setSearching] = useState(customer === null);
  const [text, setText] = useState('');
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const changeButtonRef = useRef<HTMLButtonElement>(null);
  // Choosing a customer replaces the search box with the customer card; focus follows to "Change".
  const focusCardAfterSelect = useRef(false);
  const listboxId = useId();
  const errorId = `${inputId}-error`;
  const search = useDebouncedValue(text.trim());

  const query = { search: search || undefined, pageSize: SEARCH_PAGE_SIZE };
  const results = useQuery({
    queryKey: customerKeys.list(query),
    queryFn: ({ signal }) => listCustomers(query, signal),
    enabled: searching,
    placeholderData: keepPreviousData,
  });
  const options = results.data?.data ?? [];

  useEffect(() => {
    if (focusCardAfterSelect.current && !searching) {
      focusCardAfterSelect.current = false;
      changeButtonRef.current?.focus();
    }
  });

  function closeSearch() {
    focusCardAfterSelect.current = true;
    setSearching(false);
  }

  function select(next: CustomerDto) {
    onChange(selectedCustomerFromDto(next));
    closeSearch();
    setOpen(false);
    setText('');
  }

  const listbox = useListbox({ options, open, onOpenChange: setOpen, onSelect: select });
  const optionId = (index: number) => `${listboxId}-${index}`;
  const expanded = open && searching;

  if (customer && !searching) {
    return (
      <SelectedCustomerCard
        customer={customer}
        changeButtonRef={changeButtonRef}
        onChange={() => {
          setSearching(true);
          setOpen(true);
          // The input mounts on the next render.
          window.setTimeout(() => inputRef.current?.focus(), 0);
        }}
      />
    );
  }

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative min-w-0 flex-1">
          <label htmlFor={inputId} className="sr-only">
            Search customers
          </label>
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-zinc-400"
          />
          <input
            ref={inputRef}
            id={inputId}
            type="text"
            role="combobox"
            aria-autocomplete="list"
            aria-expanded={expanded}
            aria-controls={listboxId}
            aria-activedescendant={
              expanded && listbox.activeIndex >= 0 ? optionId(listbox.activeIndex) : undefined
            }
            aria-invalid={Boolean(error) || undefined}
            aria-describedby={error ? errorId : undefined}
            autoComplete="off"
            placeholder="Search by name, email or phone"
            className={cn(CONTROL_CLASSES, 'h-11 pl-9')}
            value={text}
            onChange={(event) => {
              setText(event.target.value);
              setOpen(true);
              listbox.setActiveIndex(-1);
            }}
            onFocus={() => setOpen(true)}
            onBlur={() => setOpen(false)}
            onKeyDown={listbox.onKeyDown}
          />
          {results.isFetching && (
            <Spinner className="absolute top-1/2 right-3 size-4 -translate-y-1/2 text-zinc-400" />
          )}
          <div
            hidden={!expanded}
            className="absolute inset-x-0 top-full z-30 mt-1 overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-lg ring-1 ring-zinc-950/5"
          >
            <ul
              id={listboxId}
              role="listbox"
              aria-label="Customers"
              className="max-h-80 overflow-auto py-1"
            >
              {options.map((option, index) => (
                <li
                  key={option.id}
                  id={optionId(index)}
                  role="option"
                  aria-selected={index === listbox.activeIndex}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => select(option)}
                  onMouseMove={() => listbox.setActiveIndex(index)}
                  className={cn(
                    'flex cursor-pointer items-center gap-3 px-3 py-2.5',
                    index === listbox.activeIndex && 'bg-brand-50',
                  )}
                >
                  <Avatar name={option.name} size="sm" />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-zinc-950">
                      {option.name}
                    </span>
                    <span className="block truncate text-xs text-zinc-500">
                      {customerSummaryLine(option) || 'No contact details'}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
            {options.length === 0 && (
              <p className="px-3 py-4 text-sm text-zinc-600">
                {results.isPending
                  ? 'Loading customers…'
                  : search
                    ? `No customers match “${search}”.`
                    : 'No customers yet. Add your first one.'}
              </p>
            )}
          </div>
        </div>
        <Button variant="secondary" className="h-11" onClick={() => setCreating(true)}>
          <UserPlus aria-hidden="true" />
          New customer
        </Button>
      </div>
      {customer && (
        <button
          type="button"
          className="mt-2 text-sm font-medium text-brand-700 hover:text-brand-800"
          onClick={closeSearch}
        >
          Keep {customer.name}
        </button>
      )}
      {error && (
        <p id={errorId} className="mt-2 flex items-center gap-1.5 text-sm text-red-700">
          <CircleAlert aria-hidden="true" className="size-4 shrink-0" />
          {error}
        </p>
      )}
      <CustomerFormDialog
        open={creating}
        onClose={() => setCreating(false)}
        onSaved={(created) => {
          setCreating(false);
          select(created);
        }}
      />
    </div>
  );
}

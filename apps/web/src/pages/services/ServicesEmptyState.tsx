import type { ServiceInput } from '@quoteflow/shared';
import { Paintbrush, Plus, Snowflake, Sparkles, Wrench } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface ExampleService {
  icon: LucideIcon;
  values: Partial<ServiceInput>;
}

/** Starting points that pre-fill the form; the price is left for the business to set. */
const EXAMPLES: readonly ExampleService[] = [
  {
    icon: Sparkles,
    values: {
      name: 'Deep cleaning',
      description: 'Kitchen, bathrooms, floors and inside appliances.',
      unit: 'visit',
    },
  },
  {
    icon: Snowflake,
    values: {
      name: 'AC installation',
      description: 'Split unit installation, including brackets and up to 3 m of piping.',
      unit: 'unit',
    },
  },
  {
    icon: Paintbrush,
    values: {
      name: 'Interior painting',
      description: 'Two coats on walls and ceiling. Paint included.',
      unit: 'room',
    },
  },
];

export function ServicesEmptyState({
  onAdd,
}: {
  onAdd: (initialValues?: Partial<ServiceInput>) => void;
}) {
  return (
    <div className="flex flex-col items-center px-6 py-12 text-center sm:py-16">
      <div className="flex size-12 items-center justify-center rounded-xl bg-brand-50 text-brand-600 ring-1 ring-brand-600/10">
        <Wrench aria-hidden="true" className="size-6" strokeWidth={1.75} />
      </div>
      <h2 className="mt-5 text-base font-semibold text-zinc-950">Build your price list</h2>
      <p className="mt-2 max-w-md text-sm text-pretty text-zinc-600">
        Save the services you offer with their prices and units, then add them to any quote in one
        click. Start from scratch or from an example.
      </p>
      <Button className="mt-6" onClick={() => onAdd()}>
        <Plus aria-hidden="true" />
        Add your first service
      </Button>
      <div className="mt-10 w-full max-w-2xl">
        <p className="text-xs font-medium tracking-wide text-zinc-500 uppercase">
          Or start from an example
        </p>
        <ul className="mt-3 grid gap-3 sm:grid-cols-3">
          {EXAMPLES.map(({ icon: Icon, values }) => (
            <li key={values.name}>
              <button
                type="button"
                onClick={() => onAdd(values)}
                className="flex h-full w-full flex-col items-start gap-2 rounded-xl border border-zinc-200 bg-white p-4 text-left transition-colors hover:border-brand-600/40 hover:bg-brand-50/40"
              >
                <Icon aria-hidden="true" className="size-5 text-brand-600" />
                <span className="text-sm font-medium text-zinc-950">{values.name}</span>
                <span className="text-xs text-zinc-500">Per {values.unit}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

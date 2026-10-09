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

/** The first visit: why a price list helps, and examples that pre-fill the form. */
export function ServicesEmptyState({
  onAdd,
}: {
  onAdd: (initialValues?: Partial<ServiceInput>) => void;
}) {
  return (
    <div className="flex animate-fade-in-up flex-col items-center rounded-xl border border-dashed border-stone-300 bg-surface px-6 py-12 text-center sm:py-14">
      <div className="flex size-11 items-center justify-center rounded-full bg-stone-100 text-stone-500">
        <Wrench aria-hidden="true" className="size-5" strokeWidth={1.75} />
      </div>
      <h2 className="mt-4 text-base font-semibold text-stone-900">Build your price list</h2>
      <p className="mt-1.5 max-w-md text-sm text-pretty text-stone-500">
        Save the services you offer with their prices and units, then add them to any quote in one
        click. Start from scratch or from an example.
      </p>
      <Button className="mt-5" onClick={() => onAdd()}>
        <Plus aria-hidden="true" />
        Add your first service
      </Button>
      <div className="mt-10 w-full max-w-2xl">
        <p className="section-label">Or start from an example</p>
        <ul className="mt-3 grid gap-3 sm:grid-cols-3">
          {EXAMPLES.map(({ icon: Icon, values }) => (
            <li key={values.name}>
              <button
                type="button"
                onClick={() => onAdd(values)}
                className="flex h-full w-full flex-col items-start gap-2 rounded-xl border border-stone-200 bg-surface p-4 text-left transition-colors hover:border-stone-300 hover:bg-stone-50"
              >
                <span className="flex size-8 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
                  <Icon aria-hidden="true" className="size-4" />
                </span>
                <span className="text-sm font-medium text-stone-900">{values.name}</span>
                <span className="text-xs text-stone-500">Per {values.unit}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

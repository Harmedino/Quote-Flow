import type { ServiceInput } from '@quoteflow/shared';
import { Paintbrush, Plus, Snowflake, Sparkles, Wrench } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';

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
    <EmptyState
      variant="dashed"
      icon={Wrench}
      title="Build your price list"
      description="Save the services you offer with their prices and units, then add them to any quote in one click. Start from scratch or from an example."
      action={
        <>
          <Button onClick={() => onAdd()}>
            <Plus aria-hidden="true" />
            Add your first service
          </Button>
          <div className="mt-5 w-full max-w-2xl">
            <p className="label-mono text-muted">Or start from an example</p>
            <ul className="mt-3 grid gap-3 sm:grid-cols-3">
              {EXAMPLES.map(({ icon: Icon, values }) => (
                <li key={values.name}>
                  <button
                    type="button"
                    onClick={() => onAdd(values)}
                    className="flex h-full w-full flex-col items-start gap-2 rounded-xl bg-surface p-4 text-left shadow-(--shadow-card) transition-colors hover:bg-surface-muted"
                  >
                    <span className="flex size-8 items-center justify-center rounded-lg bg-primary-tint text-primary-ink">
                      <Icon aria-hidden="true" className="size-4" />
                    </span>
                    <span className="text-[14.5px] font-bold text-ink">{values.name}</span>
                    <span className="font-mono text-xs text-muted">Per {values.unit}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </>
      }
    />
  );
}

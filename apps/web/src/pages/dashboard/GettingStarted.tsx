import { ArrowRight, Check } from 'lucide-react';
import { Link } from 'react-router';
import { Card } from '@/components/ui/Card';
import type { ChecklistItem } from '@/features/dashboard/getting-started';
import { cn } from '@/lib/cn';

export function GettingStarted({ items }: { items: readonly ChecklistItem[] }) {
  const done = items.filter((item) => item.done).length;

  return (
    <Card aria-labelledby="getting-started-title" role="region">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-zinc-200 px-5 py-5 sm:px-6">
        <div>
          <h2 id="getting-started-title" className="text-lg font-semibold text-zinc-950">
            Get set up in a few minutes
          </h2>
          <p className="mt-1 text-sm text-zinc-600">
            Four quick steps and you are ready to send your first quote.
          </p>
        </div>
        <div className="w-full sm:w-48">
          <p className="text-right text-xs font-medium text-zinc-600">
            {done} of {items.length} done
          </p>
          <div
            className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-zinc-100"
            role="progressbar"
            aria-label="Setup progress"
            aria-valuemin={0}
            aria-valuemax={items.length}
            aria-valuenow={done}
          >
            <div
              className="h-full rounded-full bg-brand-600 transition-[width]"
              style={{ width: `${(done / items.length) * 100}%` }}
            />
          </div>
        </div>
      </div>
      <ol className="divide-y divide-zinc-100">
        {items.map((item, index) => (
          <li key={item.id}>
            <Link
              to={item.to}
              className="group flex items-center gap-4 px-5 py-4 transition-colors hover:bg-zinc-50 sm:px-6"
            >
              <span
                className={cn(
                  'flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold',
                  item.done
                    ? 'bg-brand-600 text-white'
                    : 'bg-white text-zinc-500 ring-1 ring-zinc-300',
                )}
              >
                {item.done ? <Check aria-hidden="true" className="size-4" /> : index + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p
                  className={cn(
                    'text-sm font-medium',
                    item.done ? 'text-zinc-500 line-through decoration-zinc-300' : 'text-zinc-950',
                  )}
                >
                  {item.title}
                  {item.done && <span className="sr-only"> (done)</span>}
                </p>
                <p className="mt-0.5 text-sm text-zinc-600">{item.description}</p>
              </div>
              {!item.done && (
                <span className="hidden shrink-0 items-center gap-1 text-sm font-medium text-brand-700 group-hover:text-brand-800 sm:inline-flex">
                  {item.action}
                  <ArrowRight aria-hidden="true" className="size-4" />
                </span>
              )}
            </Link>
          </li>
        ))}
      </ol>
    </Card>
  );
}

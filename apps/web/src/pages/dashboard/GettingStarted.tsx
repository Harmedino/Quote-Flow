import { ArrowRight, Check, ChevronRight } from 'lucide-react';
import { useId } from 'react';
import { Link } from 'react-router';
import { ButtonLink } from '@/components/ui/ButtonLink';
import type { ChecklistItem } from '@/features/dashboard/getting-started';
import { cn } from '@/lib/cn';

const HOW_IT_WORKS = [
  { title: 'Price the job', text: 'Add items from your services, a discount and tax.' },
  {
    title: 'Share it on WhatsApp or by link',
    text: 'Your customer opens a page in your brand colour and accepts or declines, no account needed.',
  },
  {
    title: 'Invoice and get paid',
    text: 'Turn the accepted quote into an invoice and record payments as they come in.',
  },
];

function SetupSteps({ items }: { items: readonly ChecklistItem[] }) {
  return (
    <ol className="mt-6 space-y-1">
      {items.map((item, index) => (
        <li key={item.id}>
          <Link
            to={item.to}
            className="group -mx-3 flex items-start gap-3 rounded-xl px-3 py-3 transition-colors hover:bg-stone-100/70"
          >
            <span
              aria-hidden="true"
              className={cn(
                'mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold',
                item.done ? 'bg-green-600 text-white' : 'border border-stone-300 text-stone-500',
              )}
            >
              {item.done ? <Check className="size-3.5" strokeWidth={3} /> : index + 1}
            </span>
            <span className="min-w-0 flex-1">
              <span
                className={cn(
                  'block text-sm font-medium',
                  item.done ? 'text-stone-500 line-through decoration-stone-300' : 'text-stone-900',
                )}
              >
                {item.title}
                {item.done && <span className="sr-only"> (done)</span>}
              </span>
              <span className="mt-0.5 block text-sm text-stone-500">{item.description}</span>
            </span>
            {!item.done && (
              <>
                <span className="hidden shrink-0 items-center gap-1 self-center text-sm font-medium text-brand-700 group-hover:text-brand-800 sm:inline-flex">
                  {item.action}
                  <ArrowRight aria-hidden="true" className="size-4" />
                </span>
                <ChevronRight
                  aria-hidden="true"
                  className="size-4 shrink-0 self-center text-stone-400 sm:hidden"
                />
              </>
            )}
          </Link>
        </li>
      ))}
    </ol>
  );
}

/** What a business sees before its first quote: the setup steps and how QuoteFlow works. */
export function GettingStarted({ items }: { items: readonly ChecklistItem[] }) {
  const titleId = useId();
  const done = items.filter((item) => item.done).length;
  const next = items.find((item) => !item.done);
  const percent = items.length ? Math.round((done / items.length) * 100) : 0;

  return (
    <div className="grid grid-cols-1 gap-8 xl:grid-cols-[minmax(0,1fr)_340px]">
      <section aria-labelledby={titleId} className="max-w-2xl">
        <p className="section-label">Get your business ready</p>
        <h2
          id={titleId}
          className="mt-1.5 text-2xl font-semibold tracking-tight text-balance text-stone-900"
        >
          A few quick steps and you’re ready to send your first quote.
        </h2>
        <div
          role="progressbar"
          aria-label="Setup progress"
          aria-valuemin={0}
          aria-valuemax={items.length}
          aria-valuenow={done}
          aria-valuetext={`${done} of ${items.length} steps complete`}
          className="mt-5 h-2 overflow-hidden rounded-full bg-stone-200"
        >
          <div
            className="h-full animate-grow-width rounded-full bg-brand-500"
            style={{ width: `${percent}%` }}
          />
        </div>
        <p className="mt-1.5 text-xs text-stone-500">
          {done} of {items.length} steps complete
        </p>
        <SetupSteps items={items} />
        {next && (
          <ButtonLink to={next.to} className="mt-6">
            Continue setup
          </ButtonLink>
        )}
      </section>

      <aside
        aria-label="How QuoteFlow works"
        className="self-start rounded-2xl bg-ink p-5 text-white dark:ring-1 dark:ring-white/10"
      >
        <p className="text-sm font-medium text-highlight">How it works</p>
        <ol className="mt-4 space-y-4">
          {HOW_IT_WORKS.map((step, index) => (
            <li key={step.title} className="flex gap-3">
              <span
                aria-hidden="true"
                className="flex size-6 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-semibold text-highlight"
              >
                {index + 1}
              </span>
              <span>
                <span className="block text-sm font-semibold">{step.title}</span>
                <span className="mt-0.5 block text-sm text-white/65">{step.text}</span>
              </span>
            </li>
          ))}
        </ol>
      </aside>
    </div>
  );
}

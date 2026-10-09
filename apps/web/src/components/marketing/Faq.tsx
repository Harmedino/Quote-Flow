import { Plus } from 'lucide-react';
import { useId, useState } from 'react';
import { cn } from '@/lib/cn';

export interface FaqEntry {
  question: string;
  answer: string;
}

function FaqItem({ question, answer }: FaqEntry) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const buttonId = `${id}-question`;
  const panelId = `${id}-answer`;

  return (
    <div className="border-b border-stone-200">
      <h3>
        <button
          id={buttonId}
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-controls={panelId}
          className="flex w-full items-center justify-between gap-6 rounded-md py-5 text-left"
        >
          <span className="text-base font-semibold text-stone-900 sm:text-lg">{question}</span>
          <span
            aria-hidden="true"
            className={cn(
              'flex size-8 shrink-0 items-center justify-center rounded-full border border-stone-300 text-stone-600 transition-transform duration-200',
              open && 'rotate-45',
            )}
          >
            <Plus className="size-4" />
          </span>
        </button>
      </h3>
      {/* Collapsed with grid rows rather than unmounted, so the height animates in CSS. */}
      <div
        id={panelId}
        role="region"
        aria-labelledby={buttonId}
        inert={!open}
        className={cn(
          'grid transition-[grid-template-rows,opacity] duration-250 ease-out',
          open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0',
        )}
      >
        <div className="overflow-hidden">
          <p className="max-w-2xl pb-5 text-[0.9375rem] leading-relaxed text-pretty text-stone-600">
            {answer}
          </p>
        </div>
      </div>
    </div>
  );
}

/** The questions section: the title on the left, questions that open to their answer on the right. */
export function FaqSection({
  title = 'Questions',
  description,
  entries,
}: {
  title?: string;
  description?: string;
  entries: readonly FaqEntry[];
}) {
  return (
    <section
      id="faq"
      aria-labelledby="faq-title"
      className="scroll-mt-20 border-t border-stone-200/70"
    >
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[0.8fr_1.2fr] lg:px-8">
        <div>
          <h2
            id="faq-title"
            className="text-3xl font-semibold tracking-tight text-stone-900 sm:text-4xl"
          >
            {title}
          </h2>
          {description && (
            <p className="mt-4 max-w-sm text-base leading-relaxed text-pretty text-stone-600">
              {description}
            </p>
          )}
        </div>
        <div className="border-t border-stone-200">
          {entries.map((entry) => (
            <FaqItem key={entry.question} {...entry} />
          ))}
        </div>
      </div>
    </section>
  );
}

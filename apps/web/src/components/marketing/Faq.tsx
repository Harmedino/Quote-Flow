import { Plus } from 'lucide-react';
import { useId, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/cn';
import { Eyebrow } from './SectionHeading';
import { SITE_CONTAINER } from './site-container';

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
    <div className="border-b-[1.5px] border-dashed border-line-strong last:border-b-0">
      <h3>
        <button
          id={buttonId}
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-controls={panelId}
          className="group flex w-full items-center justify-between gap-6 rounded-md py-5 text-left"
        >
          <span className="text-base font-[650] text-ink sm:text-[1.0625rem]">{question}</span>
          <span
            aria-hidden="true"
            className={cn(
              'flex size-8 shrink-0 items-center justify-center rounded-[9px] transition-[rotate,background-color,color] duration-200',
              open
                ? 'rotate-45 bg-primary text-on-primary'
                : 'text-ink-2 shadow-[inset_0_0_0_1px_var(--color-line-strong)] group-hover:bg-surface-muted',
            )}
          >
            <Plus className="size-4 stroke-[2.4]" />
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
          <p className="max-w-2xl pb-5 text-[0.9375rem] leading-relaxed text-pretty text-ink-2">
            {answer}
          </p>
        </div>
      </div>
    </div>
  );
}

/** The questions section: the title on the left, a receipt of questions that open to their answer. */
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
    <section id="faq" aria-labelledby="faq-title" className="scroll-mt-24 xl:scroll-mt-28">
      <div className={cn(SITE_CONTAINER, 'grid gap-10 py-16 sm:py-24 lg:grid-cols-[0.8fr_1.2fr]')}>
        <div>
          <Eyebrow>FAQ</Eyebrow>
          <h2 id="faq-title" className="mt-3.5 heading-section text-balance text-ink">
            {title}
          </h2>
          {description && (
            <p className="mt-5 max-w-sm text-[1.0625rem] leading-relaxed text-pretty text-ink-2">
              {description}
            </p>
          )}
        </div>
        <Card className="px-5 sm:px-7">
          {entries.map((entry) => (
            <FaqItem key={entry.question} {...entry} />
          ))}
        </Card>
      </div>
    </section>
  );
}

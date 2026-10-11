import { cn } from '@/lib/cn';
import { Reveal } from './Reveal';

export interface Step {
  title: string;
  body: string;
}

/** The step's number, as on the home page's job tickets: wide, heavy, in orange-for-text. */
export function StepNumber({ index, className }: { index: number; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'text-[2.125rem] leading-none font-[860] tracking-[-0.03em] text-primary-ink font-stretch-125% sm:text-[2.5rem]',
        className,
      )}
    >
      {String(index + 1).padStart(2, '0')}
    </span>
  );
}

/** Steps torn along dashed rules: the number down the left, the title, then what happens. */
export function NumberedSteps({ steps }: { steps: readonly Step[] }) {
  return (
    <ol className="mt-10 border-b-[1.5px] border-dashed border-line-strong">
      {steps.map((step, index) => (
        <li key={step.title}>
          <Reveal
            delay={index * 50}
            className="grid grid-cols-[3.25rem_1fr] gap-x-4 gap-y-1.5 border-t-[1.5px] border-dashed border-line-strong py-6 sm:grid-cols-[5rem_1fr_1.35fr] sm:gap-x-8 sm:py-7"
          >
            <StepNumber index={index} />
            <h3 className="self-center text-lg leading-snug font-[750] text-ink font-stretch-112% sm:self-start sm:pt-1 sm:text-xl">
              {step.title}
            </h3>
            <p className="col-start-2 text-[0.9375rem] leading-relaxed text-pretty text-ink-2 sm:col-start-3 sm:pt-1">
              {step.body}
            </p>
          </Reveal>
        </li>
      ))}
    </ol>
  );
}

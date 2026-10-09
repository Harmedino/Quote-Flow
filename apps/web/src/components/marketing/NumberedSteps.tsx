import { Reveal } from './Reveal';

export interface Step {
  title: string;
  body: string;
}

/** Big grey numbers down the left, the step's title, then its explanation. */
export function NumberedSteps({ steps }: { steps: readonly Step[] }) {
  return (
    <ol className="mt-8">
      {steps.map((step, index) => (
        <li key={step.title}>
          <Reveal
            delay={index * 50}
            className="grid grid-cols-[3rem_1fr] gap-x-4 gap-y-2 border-t border-stone-200 py-6 sm:grid-cols-[4rem_1fr_1.5fr] sm:gap-x-8"
          >
            <span aria-hidden="true" className="font-display text-3xl font-semibold text-stone-400">
              {index + 1}
            </span>
            <h3 className="text-lg font-semibold text-stone-900 sm:text-xl">{step.title}</h3>
            <p className="col-start-2 text-[0.9375rem] leading-relaxed text-pretty text-stone-600 sm:col-start-3">
              {step.body}
            </p>
          </Reveal>
        </li>
      ))}
    </ol>
  );
}

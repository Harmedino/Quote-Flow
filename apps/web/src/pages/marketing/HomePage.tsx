import { ArrowRight } from 'lucide-react';
import { paths } from '@/app/paths';
import { DocumentTitle } from '@/components/DocumentTitle';
import { ButtonLink } from '@/components/ui/ButtonLink';

export default function HomePage() {
  return (
    <>
      <DocumentTitle title="Quotes and invoices for service businesses" />
      <section className="relative isolate overflow-hidden">
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-[radial-gradient(var(--color-zinc-200)_1px,transparent_1px)] [mask-image:radial-gradient(ellipse_60%_55%_at_50%_40%,black,transparent)] bg-size-[22px_22px]"
        />
        <div className="mx-auto max-w-6xl px-4 pt-20 pb-24 sm:px-6 sm:pt-28 sm:pb-32 lg:pt-32">
          <div className="mx-auto max-w-4xl text-center">
            <p className="inline-flex items-center rounded-full bg-white px-3 py-1 text-sm font-medium text-brand-700 ring-1 ring-brand-600/20 ring-inset">
              Built for service businesses
            </p>
            <h1 className="mt-6 text-4xl font-semibold tracking-tight text-zinc-950 sm:text-6xl">
              <span className="block text-balance">Create quotes. Get approvals.</span>{' '}
              <span className="block text-brand-600">Get paid.</span>
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-lg text-pretty text-zinc-600">
              QuoteFlow helps service businesses create, send, track, and convert quotes into
              invoices.
            </p>
            <div className="mt-10 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
              <ButtonLink to={paths.register} size="lg">
                Start free
                <ArrowRight aria-hidden="true" />
              </ButtonLink>
              <ButtonLink to={paths.login} size="lg" variant="secondary">
                Sign in
              </ButtonLink>
            </div>
            <p className="mx-auto mt-10 max-w-md text-sm text-pretty text-zinc-500">
              For cleaners, plumbers, electricians, AC technicians, painters, movers and more.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}

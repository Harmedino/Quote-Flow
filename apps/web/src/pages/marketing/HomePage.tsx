import { ArrowRight, Check } from 'lucide-react';
import type { ReactNode } from 'react';
import { paths } from '@/app/paths';
import { DocumentTitle } from '@/components/DocumentTitle';
import { ButtonLink } from '@/components/ui/ButtonLink';
import { buttonClasses } from '@/components/ui/button-styles';
import { DemoLoginButton } from '@/features/auth/DemoLoginButton';
import { cn } from '@/lib/cn';
import { Features } from './home/Features';
import { HowItWorks } from './home/HowItWorks';
import { Pricing } from './home/Pricing';
import { ProductPreview } from './home/ProductPreview';

const HIGHLIGHTS = ['No card needed', 'Customers need no account', 'Works on any phone'];

interface SectionProps {
  id: string;
  eyebrow: string;
  title: string;
  intro?: string;
  className?: string;
  children: ReactNode;
}

function Section({ id, eyebrow, title, intro, className, children }: SectionProps) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className={cn('scroll-mt-16', className)}>
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-24">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold text-brand-700">{eyebrow}</p>
          <h2
            id={`${id}-title`}
            className="mt-2 text-3xl font-semibold tracking-tight text-balance text-zinc-950 sm:text-4xl"
          >
            {title}
          </h2>
          {intro && <p className="mt-4 text-base leading-7 text-pretty text-zinc-600">{intro}</p>}
        </div>
        <div className="mt-12">{children}</div>
      </div>
    </section>
  );
}

export default function HomePage() {
  return (
    <>
      <DocumentTitle title="Quotes and invoices for service businesses" />
      <section className="relative isolate overflow-hidden">
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-[radial-gradient(var(--color-zinc-200)_1px,transparent_1px)] [mask-image:radial-gradient(ellipse_60%_55%_at_50%_40%,black,transparent)] bg-size-[22px_22px]"
        />
        <div className="mx-auto max-w-6xl px-4 pt-16 pb-20 sm:px-6 sm:pt-24 lg:pt-28">
          <div className="mx-auto max-w-3xl text-center">
            <p className="inline-flex items-center rounded-full bg-white px-3 py-1 text-xs font-medium text-brand-700 ring-1 ring-brand-600/20 ring-inset sm:text-sm">
              For cleaners, plumbers, electricians and more
            </p>
            <h1 className="mt-6 text-4xl font-semibold tracking-tight text-zinc-950 sm:text-6xl">
              <span className="block text-balance">Create quotes. Get approvals.</span>{' '}
              <span className="block text-brand-600">Get paid.</span>
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-pretty text-zinc-600">
              Send a professional quote from your phone in minutes. Your customer approves it with
              one tap, and you turn it into an invoice and track every payment until it is paid.
            </p>
            <div className="mt-10 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
              <ButtonLink to={paths.register} size="lg">
                Start free
                <ArrowRight aria-hidden="true" />
              </ButtonLink>
              <DemoLoginButton
                size="lg"
                label="View live demo"
                className="w-full sm:w-auto"
                fallback={
                  <a
                    href="#product"
                    className={buttonClasses({ size: 'lg', variant: 'secondary' })}
                  >
                    View demo
                  </a>
                }
              />
            </div>
            <ul className="mt-8 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-zinc-600">
              {HIGHLIGHTS.map((item) => (
                <li key={item} className="inline-flex items-center gap-1.5">
                  <Check aria-hidden="true" className="size-4 text-brand-600" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section
        id="product"
        aria-labelledby="product-title"
        className="scroll-mt-16 border-y border-zinc-200/70 bg-zinc-50"
      >
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-24">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold text-brand-700">See it in action</p>
            <h2
              id="product-title"
              className="mt-2 text-3xl font-semibold tracking-tight text-balance text-zinc-950 sm:text-4xl"
            >
              Build it on your side. They approve it on theirs.
            </h2>
            <p className="mt-4 text-base leading-7 text-pretty text-zinc-600">
              A quote put together from saved services, and exactly what your customer sees when
              they open the link you sent on WhatsApp.
            </p>
          </div>
          <div className="mx-auto mt-14 max-w-5xl">
            <ProductPreview />
          </div>
        </div>
      </section>

      <Section
        id="features"
        eyebrow="Everything in one place"
        title="From first quote to final payment"
        intro="QuoteFlow replaces the spreadsheet, the word processor and the notes app with one simple flow your customers will find easy too."
      >
        <Features />
      </Section>

      <Section
        id="how-it-works"
        eyebrow="How it works"
        title="Four steps, no paperwork"
        className="border-y border-zinc-200/70 bg-zinc-50"
      >
        <HowItWorks />
      </Section>

      <Section
        id="pricing"
        eyebrow="Pricing"
        title="Free during early access"
        intro="Every feature, no limits on quotes or invoices, and no card required to start."
      >
        <Pricing />
      </Section>

      <section aria-labelledby="final-cta-title" className="px-4 pb-20 sm:px-6 sm:pb-24">
        <div className="mx-auto max-w-6xl rounded-2xl bg-brand-700 px-6 py-14 text-center sm:px-12">
          <h2
            id="final-cta-title"
            className="text-3xl font-semibold tracking-tight text-balance text-white sm:text-4xl"
          >
            Send your next quote with QuoteFlow
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-pretty text-brand-50">
            Set up your business in a few minutes and have a quote with your customer today.
          </p>
          <div className="mt-8 flex justify-center">
            <ButtonLink
              to={paths.register}
              size="lg"
              variant="secondary"
              className="bg-white text-brand-800 hover:bg-brand-50"
            >
              Start free
              <ArrowRight aria-hidden="true" />
            </ButtonLink>
          </div>
        </div>
      </section>
    </>
  );
}

import { ArrowRight, LayoutDashboard } from 'lucide-react';
import type { ReactNode } from 'react';
import { paths } from '@/app/paths';
import { StepNumber } from '@/components/marketing/NumberedSteps';
import type { DemoStatus } from '@/components/marketing/use-demo-status';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { ButtonLink } from '@/components/ui/ButtonLink';
import { Skeleton } from '@/components/ui/Skeleton';
import { useDemoLogin } from '@/features/auth/use-demo-login';
import { getErrorMessage } from '@/lib/api-error';
import { useOpenDemoQuote } from './use-demo';

/** One way into the demo, as a ticket: the side and its number on the stub, then what you'll do. */
function ActionTicket({
  index,
  side,
  title,
  children,
  action,
  error,
}: {
  index: number;
  side: string;
  title: string;
  children: ReactNode;
  action: ReactNode;
  error?: unknown;
}) {
  return (
    <article className="flex h-full flex-col lift ticket-col">
      <div className="flex items-center justify-between gap-3 bg-primary-tint px-5 py-4 sm:px-6">
        <p className="label-mono text-ink-2">{side}</p>
        <StepNumber index={index} />
      </div>
      <div className="flex flex-1 flex-col px-5 pt-5 pb-6 sm:px-6">
        <h2 className="text-2xl leading-tight font-[800] tracking-[-0.02em] text-ink font-stretch-118%">
          {title}
        </h2>
        <p className="mt-2 flex-1 text-[0.9375rem] leading-relaxed text-pretty text-ink-2">
          {children}
        </p>
        <div className="mt-6">{action}</div>
        {error != null && (
          <Alert tone="danger" className="mt-4">
            {getErrorMessage(error)}
          </Alert>
        )}
      </div>
    </article>
  );
}

/** A button label that is shortened below the wide layout, where the tickets are narrow. */
function Label({ short, full }: { short: string; full: string }) {
  return (
    <>
      <span className="lg:hidden">{short}</span>
      <span className="hidden lg:inline">{full}</span>
    </>
  );
}

function LiveDemoActions() {
  const openQuote = useOpenDemoQuote();
  const owner = useDemoLogin();
  return (
    <div className="grid gap-6 sm:grid-cols-2">
      <ActionTicket
        index={0}
        side="As the customer"
        title="Open a quote and answer it"
        error={openQuote.error}
        action={
          <Button
            variant="primary"
            size="xl"
            className="group w-full"
            loading={openQuote.isPending}
            onClick={() => openQuote.mutate()}
          >
            <Label short="Open as the customer" full="Open a quote as the customer" />
            <ArrowRight
              aria-hidden="true"
              className="transition-transform group-hover:translate-x-0.5"
            />
          </Button>
        }
      >
        The page a customer gets from your WhatsApp message: the business’s details, every item and
        the total. Accept it or decline it, no account needed.
      </ActionTicket>
      <ActionTicket
        index={1}
        side="As the owner"
        title="See the business’s side"
        error={owner.error}
        action={
          <Button
            variant="outline"
            size="xl"
            className="w-full"
            loading={owner.pending}
            onClick={owner.start}
          >
            <LayoutDashboard aria-hidden="true" />
            <Label short="Open as the owner" full="Open the dashboard as the owner" />
          </Button>
        }
      >
        You’re signed in to the sample business. Find the quote you just answered, turn it into an
        invoice and record a payment.
      </ActionTicket>
    </div>
  );
}

/** Shown when this deployment has no demo: two other ways in, as the same tickets. */
function NoDemo() {
  return (
    <div className="grid gap-6 sm:grid-cols-2">
      <ActionTicket
        index={0}
        side="Your own account"
        title="Try it on your own phone"
        action={
          <ButtonLink to={paths.register} variant="primary" size="xl" className="group w-full">
            Start free
            <ArrowRight
              aria-hidden="true"
              className="transition-transform group-hover:translate-x-0.5"
            />
          </ButtonLink>
        }
      >
        Create a free account, add a customer with your own number and send yourself a quote on
        WhatsApp. It takes about two minutes.
      </ActionTicket>
      <ActionTicket
        index={1}
        side="No sign-up"
        title="Walk through the screens"
        action={
          <ButtonLink to={paths.howItWorks} variant="outline" size="xl" className="w-full">
            How it works
          </ButtonLink>
        }
      >
        The tour below shows each step on a phone, from building the quote to recording the payment.
      </ActionTicket>
    </div>
  );
}

/** The two ways into the demo, or how to try QuoteFlow when there is no demo. */
export function DemoActions({ status }: { status: DemoStatus }) {
  if (status === 'checking') {
    return (
      <div className="grid gap-6 sm:grid-cols-2" aria-busy="true">
        <Skeleton className="h-72 rounded-xl" />
        <Skeleton className="h-72 rounded-xl" />
      </div>
    );
  }
  return status === 'available' ? <LiveDemoActions /> : <NoDemo />;
}

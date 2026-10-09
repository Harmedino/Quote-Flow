import { ArrowRight, LayoutDashboard } from 'lucide-react';
import type { ReactNode } from 'react';
import { paths } from '@/app/paths';
import type { DemoStatus } from '@/components/marketing/use-demo-status';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { ButtonLink } from '@/components/ui/ButtonLink';
import { Skeleton } from '@/components/ui/Skeleton';
import { useDemoLogin } from '@/features/auth/use-demo-login';
import { getErrorMessage } from '@/lib/api-error';
import { useOpenDemoQuote } from './use-demo';

function ActionCard({
  side,
  title,
  children,
  action,
  error,
}: {
  side: string;
  title: string;
  children: ReactNode;
  action: ReactNode;
  error: unknown;
}) {
  return (
    <article className="flex h-full flex-col rounded-3xl border border-stone-200 bg-surface p-5 sm:p-6">
      <p className="text-sm font-medium text-brand-700">{side}</p>
      <h2 className="mt-2 text-2xl font-semibold tracking-tight text-stone-900">{title}</h2>
      <p className="mt-2 flex-1 text-[0.9375rem] leading-relaxed text-pretty text-stone-600">
        {children}
      </p>
      <div className="mt-6">{action}</div>
      {error != null && (
        <Alert tone="danger" className="mt-4">
          {getErrorMessage(error)}
        </Alert>
      )}
    </article>
  );
}

/** A button label that is shortened below the wide layout, where the cards are narrow. */
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
    <div className="grid gap-4 sm:grid-cols-2">
      <ActionCard
        side="As the customer"
        title="Open a quote and answer it"
        error={openQuote.error}
        action={
          <Button
            variant="ink"
            size="xl"
            shape="pill"
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
      </ActionCard>
      <ActionCard
        side="As the owner"
        title="See the business’s side"
        error={owner.error}
        action={
          <Button
            variant="secondary"
            size="xl"
            shape="pill"
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
      </ActionCard>
    </div>
  );
}

/** Shown when this deployment has no demo: everything else on the page still works. */
function NoDemo() {
  return (
    <article className="rounded-3xl border border-stone-200 bg-surface p-6 sm:p-8">
      <h2 className="text-2xl font-semibold tracking-tight text-stone-900">
        The live demo isn’t switched on here
      </h2>
      <p className="mt-2 max-w-xl text-[0.9375rem] leading-relaxed text-pretty text-stone-600">
        You can still walk through the screens below. Or create a free account and send a quote to
        your own phone: it takes about two minutes.
      </p>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <ButtonLink to={paths.register} variant="ink" size="xl" shape="pill" className="group">
          Start free
          <ArrowRight
            aria-hidden="true"
            className="transition-transform group-hover:translate-x-0.5"
          />
        </ButtonLink>
        <ButtonLink to={paths.howItWorks} variant="secondary" size="xl" shape="pill">
          How it works
        </ButtonLink>
      </div>
    </article>
  );
}

/** The two ways into the demo, or how to try QuoteFlow when there is no demo. */
export function DemoActions({ status }: { status: DemoStatus }) {
  if (status === 'checking') {
    return (
      <div className="grid gap-4 sm:grid-cols-2" aria-busy="true">
        <Skeleton className="h-72 rounded-3xl" />
        <Skeleton className="h-72 rounded-3xl" />
      </div>
    );
  }
  return status === 'available' ? <LiveDemoActions /> : <NoDemo />;
}

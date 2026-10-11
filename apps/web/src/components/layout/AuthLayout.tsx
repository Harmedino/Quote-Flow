import { Check, HardHat } from 'lucide-react';
import type { CSSProperties } from 'react';
import { Link, Outlet, useLocation } from 'react-router';
import { paths } from '@/app/paths';
import { PHOTOS } from '@/components/marketing/photos';
import { Logo } from '@/components/ui/Logo';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { Copyright } from './Copyright';
import { MAIN_CONTENT_ID, SkipLink } from './SkipLink';

const POINTS = [
  'Build a quote with items, discount and tax in minutes',
  'Customers accept or decline from the link, no account needed',
  'Turn a yes into an invoice and record every payment',
];

const PANEL_COPY = {
  signIn: {
    headline: 'Send the quote. Get the yes.',
    description:
      'Price the job, share the quote on WhatsApp or by link, and turn the yes into an invoice.',
  },
  register: {
    headline: 'Your first quote can go out today.',
    description: 'Add your services and customers once, then send a quote in a couple of minutes.',
  },
};

/** A tape-measure blade standing on the photo's edge: navy ticks every 4px, longer every 20 and 40. */
const TAPE_BLADE = {
  background: [
    'repeating-linear-gradient(to bottom, var(--color-navy) 0 1.5px, transparent 1.5px 40px) 0 0 / 17px 100% no-repeat',
    'repeating-linear-gradient(to bottom, var(--color-navy) 0 1px, transparent 1px 20px) 0 0 / 11px 100% no-repeat',
    'repeating-linear-gradient(to bottom, var(--color-navy) 0 1px, transparent 1px 4px) 0 0 / 6px 100% no-repeat',
    'var(--color-primary)',
  ].join(', '),
} satisfies CSSProperties;

/**
 * The photo beside the auth forms on large screens: people on site, a strip of barrier tape
 * across the top, a tape measure along the edge, and the pitch on a navy wash at the foot.
 */
function AuthPhotoPanel({ pathname }: { pathname: string }) {
  const { headline, description } =
    pathname === paths.register ? PANEL_COPY.register : PANEL_COPY.signIn;
  const photo = PHOTOS.wallCheck;

  return (
    <div className="sticky top-0 hidden h-dvh p-4 pl-0 lg:block">
      <div className="relative isolate flex h-full flex-col justify-end overflow-hidden rounded-[18px] bg-navy text-on-navy">
        <img
          src={photo.src}
          srcSet={photo.srcSet}
          sizes="50vw"
          alt={photo.alt}
          width={photo.width}
          height={photo.height}
          // Lazy, so phones (where the panel is hidden) never download it.
          loading="lazy"
          decoding="async"
          // The hard hats touch the photo's top edge, so any crop keeps the top.
          className="absolute inset-0 -z-10 size-full object-cover object-[44%_0%]"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-linear-to-t from-navy from-25% via-navy/70 via-55% to-transparent to-80%"
        />
        <div aria-hidden="true" className="absolute inset-x-0 top-0 h-3 hazard-tape" />
        <div
          aria-hidden="true"
          style={TAPE_BLADE}
          className="absolute top-20 right-6 bottom-[55%] w-9.5 rounded-[4px] shadow-[0_6px_18px_rgb(14_27_51/0.25),inset_0_0_0_1px_rgb(14_27_51/0.12)]"
        />

        <div className="max-w-xl p-10 xl:p-14">
          <p className="inline-flex h-6 items-center gap-1.5 rounded-[5px] bg-on-navy px-2 font-mono text-[11.5px] font-semibold tracking-[0.07em] text-navy uppercase">
            <HardHat aria-hidden="true" className="size-3.5" strokeWidth={2.25} />
            For the trades
          </p>
          <p className="mt-5 text-[40px] leading-[1.02] font-[840] tracking-[-0.03em] text-balance font-stretch-120% xl:text-[46px]">
            {headline}
          </p>
          <p className="mt-4 max-w-md text-base text-pretty text-on-navy/80">{description}</p>
          <ul className="mt-7 space-y-3">
            {POINTS.map((point) => (
              <li key={point} className="flex items-start gap-3 text-[14.5px] text-on-navy/90">
                <span className="mt-px flex size-5 shrink-0 items-center justify-center rounded-[5px] bg-primary text-on-primary">
                  <Check aria-hidden="true" className="size-3.5" strokeWidth={3} />
                </span>
                {point}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default function AuthLayout() {
  const { pathname } = useLocation();
  return (
    <div className="min-h-dvh bg-canvas">
      <SkipLink />
      <div aria-hidden="true" className="sticky top-0 z-10 h-1 hazard-tape" />
      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
        <div className="flex min-h-[calc(100dvh-0.25rem)] min-w-0 flex-col">
          <header className="flex h-16 items-center justify-between gap-4 px-4 sm:px-8 lg:h-20 lg:px-12">
            <Link to={paths.home} className="flex rounded-lg">
              <Logo />
            </Link>
            <ThemeToggle />
          </header>
          <main
            id={MAIN_CONTENT_ID}
            tabIndex={-1}
            className="flex flex-1 items-start justify-center px-4 pt-6 pb-10 focus:outline-none sm:items-center sm:py-14"
          >
            <div key={pathname} className="w-full max-w-[25rem] animate-fade-in-up">
              <Outlet />
            </div>
          </main>
          <footer className="px-4 pb-6 text-center lg:px-12 lg:text-left">
            <Copyright />
          </footer>
        </div>
        <AuthPhotoPanel pathname={pathname} />
      </div>
    </div>
  );
}

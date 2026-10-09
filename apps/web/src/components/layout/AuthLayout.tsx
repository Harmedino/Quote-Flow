import { Check } from 'lucide-react';
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

/** The ink panel beside the auth forms on large screens, with a photo tucked into its corner. */
function AuthBrandPanel({ pathname }: { pathname: string }) {
  const { headline, description } =
    pathname === paths.register ? PANEL_COPY.register : PANEL_COPY.signIn;
  const photo = PHOTOS.wallCheck;

  return (
    <div className="relative hidden overflow-hidden bg-ink-grid lg:flex lg:w-1/2 lg:flex-col lg:p-10 xl:p-14">
      <Link to={paths.home} className="flex w-fit rounded-lg">
        <Logo tone="light" />
      </Link>

      <div className="mt-14 max-w-md">
        <p className="font-display text-4xl leading-[1.1] font-semibold tracking-tight text-balance text-white xl:text-[2.75rem]">
          {headline}
        </p>
        <p className="mt-4 text-base text-pretty text-white/65">{description}</p>
        <ul className="mt-8 space-y-3">
          {POINTS.map((point) => (
            <li key={point} className="flex items-start gap-3 text-sm text-white/80">
              <span className="mt-px flex size-5 shrink-0 items-center justify-center rounded-full bg-highlight text-ink">
                <Check aria-hidden="true" className="size-3" strokeWidth={3} />
              </span>
              {point}
            </li>
          ))}
        </ul>
      </div>

      <div className="relative mt-auto -mr-10 -mb-10 pt-12 xl:-mr-14 xl:-mb-14">
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
          className="block aspect-[3/2] w-full rounded-tl-2xl object-cover object-top"
        />
      </div>
    </div>
  );
}

export default function AuthLayout() {
  const { pathname } = useLocation();
  return (
    <div className="flex min-h-dvh bg-surface">
      <SkipLink />
      <AuthBrandPanel pathname={pathname} />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 items-center justify-between gap-4 px-4 sm:px-8 lg:justify-end">
          <Link to={paths.home} className="flex rounded-lg lg:hidden">
            <Logo />
          </Link>
          <ThemeToggle />
        </header>
        <main
          id={MAIN_CONTENT_ID}
          tabIndex={-1}
          className="flex flex-1 items-center justify-center px-4 py-10 focus:outline-none sm:py-16"
        >
          <div key={pathname} className="w-full max-w-sm animate-fade-in-up">
            <Outlet />
          </div>
        </main>
        <footer className="px-4 pb-6 text-center">
          <Copyright />
        </footer>
      </div>
    </div>
  );
}

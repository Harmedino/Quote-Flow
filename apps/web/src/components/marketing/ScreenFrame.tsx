import { APP_NAME } from '@/app/constants';
import { cn } from '@/lib/cn';
import type { AppScreen } from './screens';

// The screenshots are of the light theme, so their frames use literal light colours and stay
// light in dark mode too.

function BrowserFrame({
  src,
  alt,
  path,
  className,
}: {
  src: string;
  alt: string;
  path: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'overflow-hidden rounded-xl border border-stone-900/10 bg-white shadow-[var(--shadow-screen)] sm:rounded-2xl',
        className,
      )}
    >
      <div className="flex items-center gap-3 border-b border-[#e7e5e4] bg-[#f4f4f2] px-3 py-2 sm:px-4 sm:py-2.5">
        <div aria-hidden="true" className="flex gap-1.5">
          <span className="size-2.5 rounded-full bg-[#ff5f57]" />
          <span className="size-2.5 rounded-full bg-[#febc2e]" />
          <span className="size-2.5 rounded-full bg-[#28c840]" />
        </div>
        <span
          aria-hidden="true"
          className="mx-auto hidden max-w-xs flex-1 truncate rounded-md bg-white px-3 py-1 text-center text-[11px] text-[#6b6b6b] sm:block"
        >
          {APP_NAME.toLowerCase()} · {path}
        </span>
        <span aria-hidden="true" className="hidden w-10 sm:block" />
      </div>
      <img
        src={src}
        alt={alt}
        width={1440}
        height={900}
        loading="lazy"
        decoding="async"
        className="block h-auto w-full"
      />
    </div>
  );
}

function PhoneFrame({ src, alt, className }: { src: string; alt: string; className?: string }) {
  return (
    <div
      className={cn(
        'rounded-[2.4rem] bg-[#0b0f0d] p-[7px] shadow-[var(--shadow-screen)] ring-1 ring-white/10',
        className,
      )}
    >
      <div className="overflow-hidden rounded-[1.95rem] bg-[#fafaf9]">
        {/* A status bar, so the notch never covers the top of the screenshot. */}
        <div aria-hidden="true" className="flex h-7 items-center justify-center bg-ink">
          <span className="h-3.5 w-[30%] rounded-full bg-[#0b0f0d]" />
        </div>
        <img
          src={src}
          alt={alt}
          width={390}
          height={844}
          loading="lazy"
          decoding="async"
          className="block h-auto w-full"
        />
      </div>
    </div>
  );
}

/** A real QuoteFlow screenshot in a minimal browser window or a phone body. */
export function ScreenFrame({ screen, className }: { screen: AppScreen; className?: string }) {
  return screen.device === 'phone' ? (
    <PhoneFrame src={screen.src} alt={screen.alt} className={className} />
  ) : (
    <BrowserFrame src={screen.src} alt={screen.alt} path={screen.path} className={className} />
  );
}

/** Two phone screenshots side by side on a soft green panel, the second one raised. */
export function PhonePair({ screens }: { screens: readonly [AppScreen, AppScreen] }) {
  return (
    <div className="mx-auto flex max-w-md justify-center gap-4 rounded-[2rem] bg-brand-100/60 px-6 pt-10 sm:gap-6 sm:px-10">
      <ScreenFrame screen={screens[0]} className="w-1/2 translate-y-6" />
      <ScreenFrame screen={screens[1]} className="w-1/2 -translate-y-2" />
    </div>
  );
}

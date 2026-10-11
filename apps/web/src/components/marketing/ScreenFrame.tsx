import { APP_NAME } from '@/app/constants';
import { cn } from '@/lib/cn';
import { useTheme } from '@/lib/theme';
import { type AppScreen, type BrowserScreen, type PhoneScreen, showsDarkCapture } from './screens';

/**
 * The capture for the website's theme. A screen without a dark one (a customer's page, which is
 * always light) stays light, and so does its browser frame (`scheme-light`).
 */
function useCapture(screen: AppScreen): { src: string; dark: boolean } {
  const dark = showsDarkCapture(screen, useTheme().theme);
  return { src: (dark && screen.srcDark) || screen.src, dark };
}

function BrowserFrame({ screen, className }: { screen: BrowserScreen; className?: string }) {
  const { src, dark } = useCapture(screen);
  return (
    <div
      className={cn(
        'overflow-hidden rounded-xl bg-surface shadow-(--shadow-elevated) sm:rounded-[0.875rem]',
        !dark && 'scheme-light',
        className,
      )}
    >
      <div className="flex items-center gap-3 border-b border-line bg-surface-muted px-3 py-2 sm:px-4 sm:py-2.5">
        <div aria-hidden="true" className="flex gap-1.5">
          <span className="size-2.5 rounded-full bg-line-strong" />
          <span className="size-2.5 rounded-full bg-line-strong" />
          <span className="size-2.5 rounded-full bg-line-strong" />
        </div>
        <span
          aria-hidden="true"
          className="mx-auto hidden max-w-xs flex-1 truncate rounded-md bg-surface px-3 py-1 text-center font-mono text-[11px] text-muted shadow-[inset_0_0_0_1px_var(--color-line)] sm:block"
        >
          {APP_NAME.toLowerCase()} · {screen.path}
        </span>
        <span aria-hidden="true" className="hidden w-10 sm:block" />
      </div>
      <img
        src={src}
        alt={screen.alt}
        width={1440}
        height={900}
        loading="lazy"
        decoding="async"
        className="block h-auto w-full"
      />
    </div>
  );
}

function PhoneFrame({ screen, className }: { screen: PhoneScreen; className?: string }) {
  const { src } = useCapture(screen);
  return (
    <div
      className={cn(
        'rounded-[2.4rem] bg-navy p-[7px] shadow-(--shadow-elevated) ring-1 ring-white/10',
        className,
      )}
    >
      {/* A status bar in the phone's own navy, so the notch never covers the screenshot. */}
      <div className="overflow-hidden rounded-[1.95rem] bg-navy">
        <div aria-hidden="true" className="flex h-7 items-center justify-center">
          <span className="h-3.5 w-[30%] rounded-full bg-black/60" />
        </div>
        <img
          src={src}
          alt={screen.alt}
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

/**
 * A real QuoteFlow screenshot in a minimal browser window or a navy phone, in the website's
 * theme. A desktop screen with a phone version shows that one on phones instead (the hidden one
 * is never downloaded: its image is lazy).
 */
export function ScreenFrame({ screen, className }: { screen: AppScreen; className?: string }) {
  if (screen.device === 'phone') return <PhoneFrame screen={screen} className={className} />;
  if (!screen.mobile) return <BrowserFrame screen={screen} className={className} />;
  return (
    <>
      <PhoneFrame
        screen={screen.mobile}
        className={cn('mx-auto w-full max-w-[17rem] sm:hidden', className)}
      />
      <BrowserFrame screen={screen} className={cn('hidden sm:block', className)} />
    </>
  );
}

/** Two phone screenshots side by side on a sunken panel, the second one raised. */
export function PhonePair({ screens }: { screens: readonly [AppScreen, AppScreen] }) {
  return (
    <div className="mx-auto flex max-w-md justify-center gap-4 rounded-[1.125rem] bg-surface-muted px-6 pt-10 shadow-[inset_0_0_0_1px_var(--color-line)] sm:gap-6 sm:px-10">
      <ScreenFrame screen={screens[0]} className="w-1/2 translate-y-6" />
      <ScreenFrame screen={screens[1]} className="w-1/2 -translate-y-2" />
    </div>
  );
}

import {
  ChevronRight,
  FileText,
  type LucideIcon,
  MoreHorizontal,
  Plus,
  Receipt,
  UserPlus,
  Wrench,
} from 'lucide-react';
import { Link, useLocation } from 'react-router';
import { APP_NAME } from '@/app/constants';
import { paths } from '@/app/paths';
import { Avatar } from '@/components/ui/Avatar';
import { LogoMark } from '@/components/ui/Logo';
import { Sheet } from '@/components/ui/Sheet';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { useAuthenticatedSession } from '@/features/auth/use-session';
import { cn } from '@/lib/cn';
import { MobileAccountPanel } from './MobileAccountPanel';
import {
  currentSectionLabel,
  hasOwnBottomBar,
  isNavItemActive,
  MOBILE_TAB_ITEMS,
  type NavItem,
} from './nav-items';

export type MobileSheetName = 'create' | 'more';

/** Which phone sheet is open, shared by the top bar and the tab bar. */
export interface MobileSheets {
  open: MobileSheetName | null;
  show: (name: MobileSheetName) => void;
  close: () => void;
}

/** The ink bar on top of phone screens: the mark, the current section, the theme and the menu. */
export function MobileTopBar({ sheets }: { sheets: MobileSheets }) {
  const { pathname } = useLocation();
  const { business } = useAuthenticatedSession();

  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between gap-3 bg-ink px-4 lg:hidden dark:border-b dark:border-white/[0.06]">
      <div className="flex min-w-0 items-center gap-2.5">
        <Link to={paths.dashboard} className="shrink-0 rounded-lg focus-visible:outline-highlight">
          <LogoMark className="size-8" onDark />
          <span className="sr-only">{APP_NAME} dashboard</span>
        </Link>
        <p className="truncate font-display text-base font-bold text-white">
          {currentSectionLabel(pathname) ?? APP_NAME}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <ThemeToggle tone="ink" />
        <button
          type="button"
          onClick={() => sheets.show('more')}
          aria-haspopup="dialog"
          aria-expanded={sheets.open === 'more'}
          className="rounded-full focus-visible:outline-highlight"
        >
          <Avatar name={business.name} tone="highlight" size="sm" />
          <span className="sr-only">Account and more</span>
        </button>
      </div>
    </header>
  );
}

/** The phone tab bar with the "+" create button, and the sheets it opens. */
export function MobileNav({ sheets }: { sheets: MobileSheets }) {
  const { pathname } = useLocation();
  const tabs = [...MOBILE_TAB_ITEMS.start, MOBILE_TAB_ITEMS.end];
  const moreActive = !tabs.some((item) => isNavItemActive(pathname, item));
  const creating = sheets.open === 'create';

  return (
    <>
      <nav
        hidden={hasOwnBottomBar(pathname)}
        aria-label="Main"
        className="pb-safe fixed inset-x-0 bottom-0 z-30 border-t border-stone-200 bg-surface/95 backdrop-blur-xl lg:hidden"
      >
        <ul className="grid grid-cols-5 items-end">
          {MOBILE_TAB_ITEMS.start.map((item) => (
            <li key={item.to}>
              <TabLink item={item} active={isNavItemActive(pathname, item)} />
            </li>
          ))}
          <li className="flex justify-center">
            <button
              type="button"
              onClick={() => (creating ? sheets.close() : sheets.show('create'))}
              aria-haspopup="dialog"
              aria-expanded={creating}
              className="-mt-5 flex size-14 items-center justify-center rounded-full bg-ink text-highlight shadow-[0_10px_24px_-8px_rgb(12_26_20/0.6)] ring-4 ring-surface transition active:scale-95 dark:bg-highlight dark:text-ink"
            >
              <Plus
                aria-hidden="true"
                strokeWidth={2.25}
                className={cn('size-6 transition-transform duration-200', creating && 'rotate-45')}
              />
              <span className="sr-only">Create</span>
            </button>
          </li>
          <li>
            <TabLink
              item={MOBILE_TAB_ITEMS.end}
              active={isNavItemActive(pathname, MOBILE_TAB_ITEMS.end)}
            />
          </li>
          <li>
            <button
              type="button"
              onClick={() => sheets.show('more')}
              aria-haspopup="dialog"
              aria-expanded={sheets.open === 'more'}
              className={cn(TAB_CLASSES, moreActive ? 'text-stone-900' : 'text-stone-500')}
            >
              {moreActive && <ActiveMarker />}
              <MoreHorizontal aria-hidden="true" className="size-[22px]" />
              More
            </button>
          </li>
        </ul>
      </nav>

      <Sheet open={creating} onClose={sheets.close} label="Create">
        <CreateMenu />
      </Sheet>
      <Sheet open={sheets.open === 'more'} onClose={sheets.close} label="Account and more">
        <MobileAccountPanel />
      </Sheet>
    </>
  );
}

const TAB_CLASSES =
  'relative flex w-full flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors focus-visible:outline-offset-[-2px]';

function ActiveMarker() {
  return <span aria-hidden="true" className="absolute top-0 h-0.5 w-8 rounded-full bg-stone-900" />;
}

function TabLink({ item, active }: { item: NavItem; active: boolean }) {
  const Icon = item.icon;
  return (
    <Link
      to={item.to}
      aria-current={active ? 'page' : undefined}
      className={cn(TAB_CLASSES, active ? 'text-stone-900' : 'text-stone-500')}
    >
      {active && <ActiveMarker />}
      <Icon aria-hidden="true" className="size-[22px]" strokeWidth={active ? 2.2 : 1.8} />
      {item.shortLabel ?? item.label}
    </Link>
  );
}

interface CreateAction {
  label: string;
  note: string;
  to: string;
  icon: LucideIcon;
}

const MORE_ACTIONS: readonly CreateAction[] = [
  {
    label: 'New invoice',
    note: 'Bill a job without a quote',
    to: paths.newInvoice,
    icon: Receipt,
  },
  {
    label: 'Add a customer',
    note: 'Save a name and number',
    to: paths.newCustomer,
    icon: UserPlus,
  },
  { label: 'Add a service', note: 'Name, price and unit', to: paths.newService, icon: Wrench },
];

/** What the "+" button opens: a new quote first, then the other ways to get started. */
function CreateMenu() {
  return (
    <div>
      <p className="section-label px-1">Create</p>
      <Link
        to={paths.newQuote}
        className="mt-3 flex items-center gap-4 rounded-2xl bg-ink px-4 py-4 text-white transition active:scale-[0.99] dark:bg-ink-700"
      >
        <FileText
          aria-hidden="true"
          className="size-6 shrink-0 text-highlight"
          strokeWidth={1.75}
        />
        <span className="min-w-0 flex-1">
          <span className="block text-base font-semibold">New quote</span>
          <span className="block text-sm text-white/65">
            Items, discount and tax, ready to share on WhatsApp
          </span>
        </span>
        <ChevronRight aria-hidden="true" className="size-5 text-white/45" />
      </Link>
      <ul className="mt-2.5 grid grid-cols-2 gap-2.5">
        {MORE_ACTIONS.map((action, index) => {
          const Icon = action.icon;
          return (
            <li
              key={action.to}
              className={cn(
                'animate-fade-in-up',
                index === MORE_ACTIONS.length - 1 && MORE_ACTIONS.length % 2 === 1 && 'col-span-2',
              )}
              style={{ animationDelay: `${50 + index * 30}ms` }}
            >
              <Link
                to={action.to}
                className="flex h-full flex-col items-start gap-3 rounded-2xl border border-stone-200 p-3.5 transition-colors active:bg-stone-50"
              >
                <Icon aria-hidden="true" className="size-5 text-stone-800" strokeWidth={1.75} />
                <span>
                  <span className="block text-sm font-semibold text-stone-900">{action.label}</span>
                  <span className="block text-xs text-stone-500">{action.note}</span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

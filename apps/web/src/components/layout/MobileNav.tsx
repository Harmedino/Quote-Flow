import { USER_ROLE_LABELS } from '@quoteflow/shared';
import {
  ChevronDown,
  ChevronRight,
  FileText,
  type LucideIcon,
  Plus,
  ReceiptText,
  UserPlus,
  Wrench,
} from 'lucide-react';
import { Link, useLocation } from 'react-router';
import { APP_NAME } from '@/app/constants';
import { paths } from '@/app/paths';
import { CountChip } from '@/components/ui/CountChip';
import { LogoMark } from '@/components/ui/Logo';
import { Sheet } from '@/components/ui/Sheet';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { useAuthenticatedSession } from '@/features/auth/use-session';
import { cn } from '@/lib/cn';
import { MobileAccountPanel } from './MobileAccountPanel';
import {
  hasOwnBottomBar,
  isNavItemActive,
  MOBILE_TAB_ITEMS,
  type NavCount,
  type NavItem,
  navCount,
} from './nav-items';
import { useNavCounts } from './use-nav-counts';

export type MobileSheetName = 'create' | 'account';

/** Which phone sheet is open, shared by the top bar and the tab bar. */
export interface MobileSheets {
  open: MobileSheetName | null;
  show: (name: MobileSheetName) => void;
  close: () => void;
}

/**
 * The phone's app bar on ticket stock: the mark, the business (which opens the account sheet
 * with settings and sign out) and dark mode.
 */
export function MobileTopBar({ sheets }: { sheets: MobileSheets }) {
  const { business, user } = useAuthenticatedSession();

  return (
    <div className="flex h-14 items-center gap-2.5 border-b border-line bg-surface px-4 lg:hidden">
      <Link to={paths.dashboard} className="shrink-0 rounded-lg">
        <LogoMark className="size-[30px]" />
        <span className="sr-only">{APP_NAME} dashboard</span>
      </Link>
      <button
        type="button"
        onClick={() => sheets.show('account')}
        aria-haspopup="dialog"
        aria-expanded={sheets.open === 'account'}
        className="-my-1 flex min-w-0 flex-col rounded-lg py-1 text-left"
      >
        <span className="flex min-w-0 items-center gap-1 text-[15px] leading-tight font-[750] font-stretch-110% text-ink">
          <span className="truncate">{business.name}</span>
          <ChevronDown aria-hidden="true" className="size-[15px] shrink-0 text-muted" />
        </span>
        <span className="truncate text-xs leading-tight text-muted">
          {user.name} · {USER_ROLE_LABELS[user.role]}
        </span>
        <span className="sr-only">, account and settings</span>
      </button>
      <ThemeToggle className="ml-auto size-[38px]" />
    </div>
  );
}

/** The phone tab bar with the orange ticket-shaped New key in the middle, and its sheets. */
export function MobileNav({ sheets }: { sheets: MobileSheets }) {
  const { pathname } = useLocation();
  const counts = useNavCounts();
  const creating = sheets.open === 'create';
  const tab = (item: NavItem) => (
    <li key={item.to}>
      <TabLink
        item={item}
        active={isNavItemActive(pathname, item)}
        count={navCount(item, counts)}
      />
    </li>
  );

  return (
    <>
      <nav
        data-tab-bar
        hidden={hasOwnBottomBar(pathname)}
        aria-label="Main"
        className="pb-safe fixed inset-x-0 bottom-0 z-30 bg-surface shadow-[0_-1px_0_var(--color-line),0_-8px_24px_rgb(14_27_51/0.06)] lg:hidden"
      >
        <ul className="grid h-[4.25rem] grid-cols-5 px-1.5">
          {MOBILE_TAB_ITEMS.start.map(tab)}
          <li>
            <button
              type="button"
              onClick={() => (creating ? sheets.close() : sheets.show('create'))}
              aria-haspopup="dialog"
              aria-expanded={creating}
              className={cn(TAB_CLASSES, 'text-ink')}
            >
              <span className="-mt-[5px] flex h-[38px] w-[52px] items-center justify-center rounded-[9px] bg-primary text-on-primary transition-transform notch-mid [--notch:5px] active:scale-95">
                <Plus
                  aria-hidden="true"
                  strokeWidth={2.6}
                  className={cn(
                    'size-[22px] transition-transform duration-200',
                    creating && 'rotate-45',
                  )}
                />
              </span>
              New
            </button>
          </li>
          {MOBILE_TAB_ITEMS.end.map(tab)}
        </ul>
      </nav>

      <Sheet open={creating} onClose={sheets.close} label="Create">
        <CreateMenu />
      </Sheet>
      <Sheet open={sheets.open === 'account'} onClose={sheets.close} label="Account and settings">
        <MobileAccountPanel />
      </Sheet>
    </>
  );
}

const TAB_CLASSES =
  'relative flex h-full w-full flex-col items-center gap-1 text-[11.5px] font-semibold transition-colors focus-visible:outline-offset-[-2px]';

function TabLink({
  item,
  active,
  count,
}: {
  item: NavItem;
  active: boolean;
  count: NavCount | null;
}) {
  const Icon = item.icon;
  return (
    <Link
      to={item.to}
      aria-current={active ? 'page' : undefined}
      className={cn(TAB_CLASSES, 'pt-[11px]', active ? 'text-ink' : 'text-muted')}
    >
      {active && (
        <span
          aria-hidden="true"
          className="absolute inset-x-[22%] top-0 h-1 animate-marker-in rounded-b-[3px] bg-primary"
        />
      )}
      <Icon aria-hidden="true" className="size-[22px]" strokeWidth={2} />
      {item.shortLabel ?? item.label}
      {count?.tone === 'alert' && (
        <CountChip
          tone="alert"
          size="sm"
          label={count.label}
          className="absolute top-[7px] left-[calc(50%+6px)] ring-2 ring-surface"
        >
          {count.value}
        </CountChip>
      )}
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
    icon: ReceiptText,
  },
  {
    label: 'Add customer',
    note: 'Save a name and number',
    to: paths.newCustomer,
    icon: UserPlus,
  },
  { label: 'Add service', note: 'Name, price and unit', to: paths.newService, icon: Wrench },
];

/** What the New key opens: a new quote first, then the other ways to get started. */
function CreateMenu() {
  return (
    <div>
      <p className="px-1 label-mono text-muted">Create</p>
      <Link
        to={paths.newQuote}
        className="mt-3 flex items-center gap-4 rounded-xl bg-primary px-4 py-4 text-on-primary shadow-[inset_0_-2px_0_rgb(14_27_51/0.22)] transition active:scale-[0.99]"
      >
        <FileText aria-hidden="true" className="size-6 shrink-0" strokeWidth={2} />
        <span className="min-w-0 flex-1">
          <span className="block text-base font-[750] font-stretch-110%">New quote</span>
          <span className="block text-sm font-medium">
            Items, discount and tax, ready to share on WhatsApp
          </span>
        </span>
        <ChevronRight aria-hidden="true" className="size-5 shrink-0" />
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
                className="flex h-full flex-col items-start gap-3 rounded-xl bg-surface p-3.5 shadow-(--shadow-card) transition-colors active:bg-surface-muted"
              >
                <Icon aria-hidden="true" className="size-5 text-primary-ink" strokeWidth={2} />
                <span>
                  <span className="block text-sm font-bold text-ink">{action.label}</span>
                  <span className="block text-xs text-muted">{action.note}</span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

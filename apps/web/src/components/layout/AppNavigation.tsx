import { Link, NavLink } from 'react-router';
import { paths } from '@/app/paths';
import { CountChip } from '@/components/ui/CountChip';
import { Logo } from '@/components/ui/Logo';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { cn } from '@/lib/cn';
import { AccountMenu } from './AccountMenu';
import {
  type NavCount,
  type NavItem,
  navCount,
  PRIMARY_NAV_ITEMS,
  SETTINGS_NAV_ITEM,
} from './nav-items';
import { useNavCounts } from './use-nav-counts';

/**
 * The desktop top bar on ticket stock: the logo, the tabs with their counts, then dark mode,
 * settings and the business menu. The active tab has an orange marker flush with the bottom edge.
 */
export function AppTopBar() {
  const counts = useNavCounts();
  return (
    <div className="hidden border-b border-line bg-surface lg:block">
      <div className="mx-auto flex h-16 max-w-[83rem] items-center gap-5 px-6 xl:gap-7 xl:px-12">
        <Link to={paths.dashboard} className="shrink-0 rounded-lg">
          <Logo />
        </Link>
        <nav aria-label="Main" className="flex h-full min-w-0 self-stretch">
          <ul className="flex items-stretch gap-0.5">
            {PRIMARY_NAV_ITEMS.map((item) => (
              <li key={item.to} className="flex">
                <TopBarTab item={item} count={navCount(item, counts)} />
              </li>
            ))}
          </ul>
        </nav>
        <div className="ml-auto flex shrink-0 items-center gap-2.5">
          <ThemeToggle />
          <SettingsLink />
          <AccountMenu />
        </div>
      </div>
    </div>
  );
}

function TopBarTab({ item, count }: { item: NavItem; count: NavCount | null }) {
  const Icon = item.icon;
  return (
    <NavLink
      to={item.to}
      className={({ isActive }) =>
        cn(
          'relative flex items-center gap-2 px-3 text-[14.5px] font-semibold whitespace-nowrap transition-colors focus-visible:outline-offset-[-2px] xl:px-3.5',
          isActive ? 'text-ink' : 'text-muted hover:text-ink',
        )
      }
    >
      {({ isActive }) => (
        <>
          <Icon aria-hidden="true" className="hidden size-[17px] xl:block" />
          {item.label}
          {count && (
            <CountChip tone={count.tone} label={count.label}>
              {count.value}
            </CountChip>
          )}
          {isActive && (
            <span
              aria-hidden="true"
              className="absolute inset-x-2.5 bottom-0 h-1 animate-marker-in rounded-t-[3px] bg-primary"
            />
          )}
        </>
      )}
    </NavLink>
  );
}

function SettingsLink() {
  const Icon = SETTINGS_NAV_ITEM.icon;
  return (
    <NavLink
      to={SETTINGS_NAV_ITEM.to}
      title={SETTINGS_NAV_ITEM.label}
      className={({ isActive }) =>
        cn(
          'inline-flex size-10 shrink-0 items-center justify-center rounded-[9px] bg-surface transition-colors hover:bg-surface-muted hover:text-ink',
          isActive
            ? 'text-ink shadow-[inset_0_0_0_1.5px_var(--color-ink)]'
            : 'text-ink-2 shadow-[inset_0_0_0_1px_var(--color-line)]',
        )
      }
    >
      <Icon aria-hidden="true" className="size-[18px]" />
      <span className="sr-only">{SETTINGS_NAV_ITEM.label}</span>
    </NavLink>
  );
}

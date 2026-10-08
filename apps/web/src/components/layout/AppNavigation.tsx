import { Plus } from 'lucide-react';
import { NavLink } from 'react-router';
import { paths } from '@/app/paths';
import { ButtonLink } from '@/components/ui/ButtonLink';
import { cn } from '@/lib/cn';
import { type NavItem, PRIMARY_NAV_ITEMS, SETTINGS_NAV_ITEM } from './nav-items';

interface AppNavigationProps {
  /** Called when a destination is chosen, e.g. to close the mobile drawer. */
  onNavigate?: () => void;
}

/** "New quote" action plus the app's primary navigation, shared by the sidebar and mobile drawer. */
export function AppNavigation({ onNavigate }: AppNavigationProps) {
  return (
    <div className="flex flex-1 flex-col gap-6">
      <ButtonLink to={paths.newQuote} onClick={onNavigate} className="w-full">
        <Plus aria-hidden="true" />
        New quote
      </ButtonLink>
      <nav aria-label="Main" className="flex flex-1 flex-col">
        <ul className="space-y-0.5">
          {PRIMARY_NAV_ITEMS.map((item) => (
            <li key={item.to}>
              <AppNavLink item={item} onNavigate={onNavigate} />
            </li>
          ))}
        </ul>
        <ul className="mt-auto pt-6">
          <li>
            <AppNavLink item={SETTINGS_NAV_ITEM} onNavigate={onNavigate} />
          </li>
        </ul>
      </nav>
    </div>
  );
}

function AppNavLink({ item, onNavigate }: { item: NavItem; onNavigate?: () => void }) {
  const Icon = item.icon;
  return (
    <NavLink
      to={item.to}
      onClick={onNavigate}
      className={({ isActive }) =>
        cn(
          'group flex h-9 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors',
          isActive
            ? 'bg-brand-50 text-brand-800'
            : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950',
        )
      }
    >
      {({ isActive }) => (
        <>
          <Icon
            aria-hidden="true"
            className={cn(
              'size-[18px] shrink-0',
              isActive ? 'text-brand-600' : 'text-zinc-400 group-hover:text-zinc-600',
            )}
          />
          {item.label}
        </>
      )}
    </NavLink>
  );
}

import { Link, NavLink } from 'react-router';
import { paths } from '@/app/paths';
import { cn } from '@/lib/cn';
import { type NavItem, PRIMARY_NAV_ITEMS, SETTINGS_NAV_ITEM } from './nav-items';

/** The sidebar's navigation, on ink: the daily screens, then settings below a hairline. */
export function AppNavigation() {
  return (
    <nav aria-label="Main" className="flex-1 overflow-y-auto px-3 py-4">
      <ul className="space-y-0.5">
        {PRIMARY_NAV_ITEMS.map((item) => (
          <li key={item.to}>
            <AppNavLink item={item} />
          </li>
        ))}
      </ul>
      <ul className="mt-5 border-t border-white/10 pt-5">
        <li>
          <AppNavLink item={SETTINGS_NAV_ITEM} />
        </li>
      </ul>
    </nav>
  );
}

function AppNavLink({ item }: { item: NavItem }) {
  const Icon = item.icon;
  return (
    <NavLink
      to={item.to}
      className={({ isActive }) =>
        cn(
          'relative flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-highlight',
          // The lime bar on the left marks the current page.
          'before:absolute before:inset-y-2 before:left-0 before:w-[3px] before:rounded-full before:bg-highlight before:transition-opacity',
          isActive
            ? 'bg-white/[0.09] text-white before:opacity-100'
            : 'text-white/65 before:opacity-0 hover:bg-white/5 hover:text-white',
        )
      }
    >
      {({ isActive }) => (
        <>
          <Icon
            aria-hidden="true"
            className={cn('size-4 shrink-0', isActive && 'text-highlight')}
          />
          {item.label}
        </>
      )}
    </NavLink>
  );
}

const CREATE_LINK =
  'flex items-center justify-center rounded-lg px-2 py-2 text-xs font-semibold whitespace-nowrap transition-colors focus-visible:outline-highlight';

/** The sidebar's standing shortcuts: start a quote (the lime one) or an invoice from anywhere. */
export function CreateCard() {
  return (
    <div className="mx-3 mb-3 rounded-2xl border border-white/10 bg-white/[0.04] p-3.5">
      <p className="text-[11px] font-semibold tracking-wider text-white/50 uppercase">Create</p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <Link
          to={paths.newInvoice}
          className={cn(CREATE_LINK, 'bg-white/10 text-white hover:bg-white/15')}
        >
          New invoice
        </Link>
        <Link
          to={paths.newQuote}
          className={cn(CREATE_LINK, 'bg-highlight text-ink hover:bg-highlight-soft')}
        >
          New quote
        </Link>
      </div>
    </div>
  );
}

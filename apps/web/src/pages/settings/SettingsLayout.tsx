import { Building2, CircleUserRound } from 'lucide-react';
import { NavLink, Outlet } from 'react-router';
import { paths } from '@/app/paths';
import { PageHeader } from '@/components/ui/PageHeader';
import { cn } from '@/lib/cn';

const SETTINGS_SECTIONS = [
  { label: 'Business', to: paths.businessSettings, icon: Building2 },
  { label: 'Account', to: paths.accountSettings, icon: CircleUserRound },
] as const;

export default function SettingsLayout() {
  return (
    <>
      <PageHeader
        title="Settings"
        description="Your business details, how your quotes look, and your own account."
      />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[13rem_minmax(0,1fr)] lg:gap-10">
        <nav aria-label="Settings" className="lg:sticky lg:top-8 lg:self-start">
          <ul className="no-scrollbar -mx-4 flex gap-1 overflow-x-auto px-4 sm:mx-0 sm:px-0 lg:flex-col">
            {SETTINGS_SECTIONS.map(({ label, to, icon: Icon }) => (
              <li key={to} className="shrink-0">
                <NavLink
                  to={to}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-brand-50 text-brand-700'
                        : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900',
                    )
                  }
                >
                  <Icon aria-hidden="true" className="size-4 shrink-0" />
                  {label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
        <div className="max-w-3xl min-w-0">
          <Outlet />
        </div>
      </div>
    </>
  );
}

import { NavLink, Outlet } from 'react-router';
import { paths } from '@/app/paths';
import { PageHeader } from '@/components/ui/PageHeader';
import { cn } from '@/lib/cn';

const SETTINGS_SECTIONS = [
  { label: 'Business', to: paths.businessSettings },
  { label: 'Account', to: paths.accountSettings },
] as const;

export default function SettingsLayout() {
  return (
    <>
      <PageHeader title="Settings" description="Manage your business profile and your account." />
      <nav aria-label="Settings" className="mb-8 border-b border-zinc-200">
        <ul className="-mb-px flex gap-6">
          {SETTINGS_SECTIONS.map((section) => (
            <li key={section.to}>
              <NavLink
                to={section.to}
                className={({ isActive }) =>
                  cn(
                    'inline-flex h-10 items-center border-b-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'border-brand-600 text-brand-700'
                      : 'border-transparent text-zinc-600 hover:border-zinc-300 hover:text-zinc-950',
                  )
                }
              >
                {section.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      <Outlet />
    </>
  );
}

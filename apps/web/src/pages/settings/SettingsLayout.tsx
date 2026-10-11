import { Building2, CircleUserRound } from 'lucide-react';
import { NavLink, Outlet } from 'react-router';
import { paths } from '@/app/paths';
import { PageHeader } from '@/components/ui/PageHeader';
import { TAB_LIST_CLASSES, TAB_SCROLLER_CLASSES, tabClasses } from '@/components/ui/tab-styles';

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
      <nav aria-label="Settings" className={TAB_SCROLLER_CLASSES}>
        <ul className={TAB_LIST_CLASSES}>
          {SETTINGS_SECTIONS.map(({ label, to, icon: Icon }) => (
            <li key={to} className="flex">
              <NavLink to={to} className={({ isActive }) => tabClasses(isActive)}>
                <Icon aria-hidden="true" />
                {label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      <div className="mt-6 min-w-0">
        <Outlet />
      </div>
    </>
  );
}

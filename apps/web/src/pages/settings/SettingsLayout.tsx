import { NavLink, Outlet } from 'react-router';
import { paths } from '@/app/paths';
import { PageHeader } from '@/components/ui/PageHeader';
import { TAB_LIST_CLASSES, TAB_SCROLLER_CLASSES, tabClasses } from '@/components/ui/tab-styles';

const SETTINGS_SECTIONS = [
  { label: 'Business', to: paths.businessSettings },
  { label: 'Account', to: paths.accountSettings },
] as const;

export default function SettingsLayout() {
  return (
    <>
      <PageHeader title="Settings" description="Manage your business profile and your account." />
      <nav aria-label="Settings" className={`mb-8 ${TAB_SCROLLER_CLASSES}`}>
        <ul className={TAB_LIST_CLASSES}>
          {SETTINGS_SECTIONS.map((section) => (
            <li key={section.to}>
              <NavLink to={section.to} className={({ isActive }) => tabClasses(isActive)}>
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

import { LayoutDashboard, Tags } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import clsx from 'clsx';

import { useI18n } from '../../i18n/I18nContext';

const items = [
  { label: 'Panel principal', to: '/admin', icon: LayoutDashboard },
  { label: 'Eventos', to: '/admin/events', icon: Tags },
  { label: 'Tipos de evento', to: '/admin/event-types', icon: Tags },
];

export function AdminSidebar() {
  const { t } = useI18n();
  return (
    <aside className="border-r border-stone-200 bg-white lg:min-h-screen">
      <div className="flex h-16 items-center border-b border-stone-200 px-5">
        <div>
          <p className="text-lg font-black tracking-tight text-stone-950">Kedada</p>
          <p className="text-xs font-semibold uppercase tracking-wide text-rose-600">Admin</p>
        </div>
      </div>
      <nav className="flex gap-2 overflow-x-auto p-3 lg:block lg:space-y-1 lg:overflow-visible">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/admin'}
            className={({ isActive }) =>
              clsx(
                'inline-flex min-w-max items-center gap-3 rounded-md px-3 py-2.5 text-sm font-semibold transition lg:flex',
                isActive ? 'bg-rose-50 text-rose-700' : 'text-stone-700 hover:bg-stone-100 hover:text-stone-950',
              )
            }
          >
            <item.icon className="h-4 w-4" />
            {t(item.label)}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}

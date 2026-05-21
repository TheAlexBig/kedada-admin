import { CalendarDays, Image, LayoutDashboard, Link as LinkIcon, Tags } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import clsx from 'clsx';

const items = [
  { label: 'Dashboard', to: '/admin', icon: LayoutDashboard },
  { label: 'Eventos', to: '/admin/events', icon: Tags },
  { label: 'Schedules', to: '/admin/schedules', icon: CalendarDays },
  { label: 'Tipos de evento', to: '/admin/event-types', icon: Tags },
  { label: 'URLs / Enlaces', to: '/admin/urls', icon: LinkIcon },
  { label: 'Media / Imagenes', to: '/admin/media', icon: Image },
];

export function AdminSidebar() {
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
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}

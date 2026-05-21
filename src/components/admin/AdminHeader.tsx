import { ButtonLink } from '../common/Button';
import { Button } from '../common/Button';
import { useAuth } from '../../auth/useAuth';

export function AdminHeader() {
  const { logout, session } = useAuth();

  return (
    <header className="flex flex-col gap-3 border-b border-stone-200 bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-sm font-semibold text-stone-500">Panel de administracion</p>
        <h1 className="text-xl font-bold text-stone-950">Gestion de contenido Kedada</h1>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        {session?.name && <span className="text-sm font-semibold text-stone-600">{session.name}</span>}
        <ButtonLink to="/admin/events/new">Crear evento</ButtonLink>
        <Button type="button" variant="secondary" onClick={logout}>
          Salir
        </Button>
      </div>
    </header>
  );
}

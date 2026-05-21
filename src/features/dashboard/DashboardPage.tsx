import { useEffect, useState } from 'react';
import { ArrowRight, CalendarPlus } from 'lucide-react';
import { Link } from 'react-router-dom';

import { getEvents } from '../../api/eventService';
import { getApiErrorMessage } from '../../api/httpClient';
import { ButtonLink } from '../../components/common/Button';
import { EmptyState } from '../../components/common/EmptyState';
import { LoadingState } from '../../components/common/LoadingState';
import { ErrorState } from '../../components/common/StatusMessage';
import type { EventResponse } from '../../types/event';
import { formatDate } from '../../utils/formatters';

export function DashboardPage() {
  const [events, setEvents] = useState<EventResponse[]>([]);
  const [totalEvents, setTotalEvents] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadDashboard() {
      try {
        setLoading(true);
        const page = await getEvents({ page: 0, size: 5, sort: 'createdAt,desc' });
        setEvents(page.content);
        setTotalEvents(page.totalElements);
        setError(null);
      } catch (loadError) {
        setError(getApiErrorMessage(loadError));
      } finally {
        setLoading(false);
      }
    }

    void loadDashboard();
  }, []);

  if (loading) {
    return <LoadingState label="Cargando dashboard..." />;
  }

  if (error) {
    return <ErrorState message={error} />;
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-[1fr_auto]">
        <div className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-stone-500">Total de eventos</p>
          <p className="mt-2 text-4xl font-black text-stone-950">{totalEvents}</p>
          <p className="mt-2 text-sm text-stone-600">Eventos activos disponibles en la API.</p>
        </div>
        <div className="rounded-lg border border-rose-100 bg-rose-50 p-5">
          <CalendarPlus className="h-8 w-8 text-rose-700" />
          <h2 className="mt-3 text-lg font-bold text-stone-950">Crear evento</h2>
          <p className="mt-1 max-w-sm text-sm leading-6 text-stone-600">
            Agrega un nuevo evento con tipo, precio, enlaces y vista previa antes de publicarlo.
          </p>
          <ButtonLink to="/admin/events/new" className="mt-4">
            Crear evento
          </ButtonLink>
        </div>
      </section>

      <section className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-stone-950">Eventos recientes</h2>
            <p className="text-sm text-stone-600">Ultimos eventos creados en Kedada.</p>
          </div>
          <Link to="/admin/events" className="inline-flex items-center gap-1 text-sm font-semibold text-rose-700">
            Ver todos <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {events.length === 0 ? (
          <EmptyState title="No se encontraron eventos" description="Crea el primer evento para empezar." />
        ) : (
          <div className="divide-y divide-stone-200">
            {events.map((event) => (
              <Link
                key={event.id}
                to={`/admin/events/${event.id}`}
                className="flex items-center justify-between gap-4 py-3 transition hover:bg-stone-50"
              >
                <div>
                  <p className="font-semibold text-stone-950">{event.title}</p>
                  <p className="mt-1 text-sm text-stone-600">Creado {formatDate(event.createdAt)}</p>
                </div>
                <ArrowRight className="h-4 w-4 text-stone-400" />
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

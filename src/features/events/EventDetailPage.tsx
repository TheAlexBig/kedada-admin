import { useEffect, useMemo, useState } from 'react';
import { ExternalLink, Pencil, Trash2 } from 'lucide-react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

import { deleteEvent, getEventById } from '../../api/eventService';
import { getEventTypeById } from '../../api/eventTypeService';
import { getApiErrorMessage } from '../../api/httpClient';
import { getSchedulesForEvent } from '../../api/scheduleService';
import { getUrlsForEvent } from '../../api/urlService';
import { Button, ButtonLink } from '../../components/common/Button';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { LoadingState } from '../../components/common/LoadingState';
import { ErrorState, SuccessMessage } from '../../components/common/StatusMessage';
import type { CategoryResponse, EventResponse, ScheduleResponse, UrlResponse } from '../../types/event';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { EventPreviewCard } from './EventPreviewCard';

export function EventDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [event, setEvent] = useState<EventResponse | null>(null);
  const [categories, setCategories] = useState<CategoryResponse[]>([]);
  const [urls, setUrls] = useState<UrlResponse[]>([]);
  const [schedules, setSchedules] = useState<ScheduleResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(
    typeof location.state === 'object' &&
      location.state !== null &&
      'message' in location.state &&
      typeof location.state.message === 'string'
      ? location.state.message
      : null,
  );
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    async function loadEvent() {
      if (!id) {
        return;
      }

      try {
        setLoading(true);
        const loadedEvent = await getEventById(id);
        setEvent(loadedEvent);
        setError(null);

        const [loadedCategories, loadedUrls, loadedSchedules] = await Promise.all([
          Promise.all(loadedEvent.categoryIds.map((categoryId) => getEventTypeById(categoryId).catch(() => undefined))),
          getUrlsForEvent(loadedEvent.id).catch(() => undefined),
          getSchedulesForEvent(loadedEvent.id).catch(() => undefined),
        ]);

        setCategories(loadedCategories.filter((category): category is CategoryResponse => category !== undefined));
        setUrls(loadedUrls?.content ?? []);
        setSchedules(loadedSchedules?.content ?? []);
      } catch (loadError) {
        setError(getApiErrorMessage(loadError));
      } finally {
        setLoading(false);
      }
    }

    void loadEvent();
  }, [id]);

  const previewPayload = useMemo(() => {
    if (!event) {
      return {};
    }

    return { ...event };
  }, [event]);

  async function handleDelete() {
    if (!event) {
      return;
    }

    try {
      setDeleting(true);
      await deleteEvent(event.id);
      setSuccess('Evento eliminado correctamente.');
      navigate('/admin/events');
    } catch (deleteError) {
      setError(getApiErrorMessage(deleteError));
    } finally {
      setDeleting(false);
      setConfirmOpen(false);
    }
  }

  if (loading) {
    return <LoadingState label="Cargando evento..." />;
  }

  if (error) {
    return <ErrorState message={error} />;
  }

  if (!event) {
    return <ErrorState message="No encontramos el evento solicitado." />;
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-2xl font-black text-stone-950">{event.title}</h2>
          <p className="mt-1 text-sm text-stone-600">Detalle del evento y datos relacionados.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <ButtonLink to={`/admin/events/${event.id}/edit`}>
            <Pencil className="h-4 w-4" /> Editar
          </ButtonLink>
          <Button type="button" variant="danger" onClick={() => setConfirmOpen(true)}>
            <Trash2 className="h-4 w-4" /> Eliminar
          </Button>
        </div>
      </div>

      {success && <SuccessMessage message={success} />}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <section className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
          <dl className="grid gap-5 sm:grid-cols-2">
            <DetailItem label="Titulo" value={event.title} />
            <DetailItem label="Tipos" value={categories.map((category) => category.name).join(', ') || 'Sin tipos cargados'} />
            <DetailItem label="Prioridad" value={String(event.priority ?? 1)} />
            <DetailItem label="Precio" value={formatCurrency(event.price)} />
            <DetailItem label="Creado" value={formatDate(event.createdAt)} />
            <DetailItem label="Actualizado" value={formatDate(event.updatedAt)} />
            <DetailItem label="Imagen" value={event.thumbnail ?? 'Sin imagen'} />
            <DetailItem label="Estado" value="Publicado" />
            <div className="sm:col-span-2">
              <dt className="text-xs font-bold uppercase tracking-wide text-stone-500">Descripcion</dt>
              <dd className="mt-1 whitespace-pre-wrap text-sm leading-6 text-stone-800">
                {event.description || 'Sin descripcion disponible.'}
              </dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-xs font-bold uppercase tracking-wide text-stone-500">Enlaces</dt>
              {urls.length === 0 ? (
                <dd className="mt-1 text-sm text-stone-900">Sin enlaces</dd>
              ) : (
                <dd className="mt-2 flex flex-col gap-2">
                  {urls.map((url) => <UrlItem key={url.id} url={url} />)}
                </dd>
              )}
            </div>
          </dl>
        </section>

        <aside className="space-y-3">
          <p className="text-sm font-bold text-stone-950">Vista previa</p>
          <EventPreviewCard event={previewPayload} categories={categories} primaryUrl={urls[0]} />
        </aside>
      </div>

      <section className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-bold text-stone-950">Schedules conectados</h3>
            <p className="mt-1 text-sm text-stone-600">Fechas asociadas a este evento desde el API de schedules.</p>
          </div>
          <ButtonLink to={`/admin/events/${event.id}/schedules`} variant="secondary">
            Administrar schedules
          </ButtonLink>
        </div>

        {schedules.length === 0 ? (
          <p className="mt-4 text-sm text-stone-600">Este evento todavia no tiene schedules conectados.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full divide-y divide-stone-200 text-sm">
              <thead className="bg-stone-50 text-left text-xs font-bold uppercase tracking-wide text-stone-500">
                <tr>
                  <th className="px-4 py-3">Inicio</th>
                  <th className="px-4 py-3">Fin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200">
                {schedules.map((schedule) => (
                  <tr key={schedule.id}>
                    <td className="px-4 py-3 text-stone-700">{formatDate(schedule.startDate)}</td>
                    <td className="px-4 py-3 text-stone-700">{formatDate(schedule.endDate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <ConfirmDialog
        open={confirmOpen}
        title="Eliminar evento"
        description="¿Estas seguro de que deseas eliminar este evento? El backend aplicara borrado logico para eventos."
        loading={deleting}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={handleDelete}
      />
    </div>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-bold uppercase tracking-wide text-stone-500">{label}</dt>
      <dd className="mt-1 break-words text-sm font-medium text-stone-900">{value}</dd>
    </div>
  );
}

function UrlItem({ url }: { url: UrlResponse }) {
  return (
    <a
      href={url.url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 text-sm font-semibold text-rose-700 hover:text-rose-800"
    >
      {url.description || url.kind || url.url} <ExternalLink className="h-3.5 w-3.5" />
    </a>
  );
}

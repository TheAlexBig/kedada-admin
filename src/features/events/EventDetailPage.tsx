import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ExternalLink, Pencil, Trash2 } from 'lucide-react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

import { deleteEvent, getEventById } from '../../api/eventService';
import { getEventTypeById } from '../../api/eventTypeService';
import { getApiErrorMessage } from '../../api/httpClient';
import { getSchedulesForEvent } from '../../api/scheduleService';
import { getUrlsForEvent } from '../../api/urlService';
import { getImage } from '../../api/mediaService';
import { Button, ButtonLink } from '../../components/common/Button';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { LoadingState } from '../../components/common/LoadingState';
import { ErrorState, SuccessMessage } from '../../components/common/StatusMessage';
import type { CategoryResponse, EventResponse, ScheduleResponse, UrlResponse } from '../../types/event';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { EventPreviewCard } from './EventPreviewCard';
import { useI18n } from '../../i18n/I18nContext';
import { useAuth } from '../../auth/useAuth';

export function EventDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { language, t } = useI18n();
  const { session } = useAuth();
  const [event, setEvent] = useState<EventResponse | null>(null);
  const [categories, setCategories] = useState<CategoryResponse[]>([]);
  const [urls, setUrls] = useState<UrlResponse[]>([]);
  const [schedules, setSchedules] = useState<ScheduleResponse[]>([]);
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
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
  const navigationState = readDetailNavigationState(location.state);
  const fromMetrics = navigationState.source === 'metrics';
  const originPath = fromMetrics ? '/admin/metrics' : '/admin/events';
  const originLabel = fromMetrics ? t('Volver a metricas') : t('Volver a eventos');
  const editState = fromMetrics ? { source: 'metrics', metricsState: navigationState.metricsState } : undefined;

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

        const [loadedCategories, loadedUrls, loadedSchedules, loadedImage] = await Promise.all([
          Promise.all(loadedEvent.categoryIds.map((categoryId) => getEventTypeById(categoryId).catch(() => undefined))),
          getUrlsForEvent(loadedEvent.id).catch(() => undefined),
          getSchedulesForEvent(loadedEvent.id).catch(() => undefined),
          loadedEvent.thumbnail ? getImage(loadedEvent.thumbnail).catch(() => undefined) : undefined,
        ]);

        setCategories(loadedCategories.filter((category): category is CategoryResponse => category !== undefined));
        setUrls(loadedUrls?.content ?? []);
        setSchedules(loadedSchedules?.content ?? []);
        setThumbnailUrl(loadedImage?.readUrl ?? null);
      } catch (loadError) {
        setError(getApiErrorMessage(loadError, language));
      } finally {
        setLoading(false);
      }
    }

    void loadEvent();
  }, [id, language]);

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
      setSuccess(t('Evento eliminado correctamente.'));
      navigate(originPath, { state: fromMetrics ? navigationState.metricsState : undefined });
    } catch (deleteError) {
      setError(getApiErrorMessage(deleteError, language));
    } finally {
      setDeleting(false);
      setConfirmOpen(false);
    }
  }

  if (loading) {
    return <LoadingState label={t('Cargando evento...')} />;
  }

  if (error) {
    return <ErrorState message={error} />;
  }

  if (!event) {
    return <ErrorState message={t('No encontramos el evento solicitado.')} />;
  }

  const isOwner = event.ownerId === session?.userId;

  return (
    <div className="space-y-5">
      <ButtonLink to={originPath} state={fromMetrics ? navigationState.metricsState : undefined} variant="ghost">
        <ArrowLeft className="h-4 w-4" /> {originLabel}
      </ButtonLink>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-2xl font-black text-stone-950">{event.title}</h2>
          <p className="mt-1 text-sm text-stone-600">{t('Detalle del evento y datos relacionados.')}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <ButtonLink to={`/admin/events/${event.id}/edit`} state={editState}>
            <Pencil className="h-4 w-4" /> {t('Editar')}
          </ButtonLink>
          <Button type="button" variant="danger" onClick={() => setConfirmOpen(true)}>
            <Trash2 className="h-4 w-4" /> {t('Eliminar')}
          </Button>
        </div>
      </div>

      {success && <SuccessMessage message={success} />}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <section className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
          <dl className="grid gap-5 sm:grid-cols-2">
            <DetailItem label={t('Titulo')} value={event.title} />
            <DetailItem label={t('Tipos')} value={categories.map((category) => category.name).join(', ') || t('Sin tipos cargados')} />
            <DetailItem label={t('Prioridad')} value={String(event.priority ?? 1)} />
            <DetailItem label={t('Precio')} value={formatCurrency(event.price, language)} />
            <DetailItem label={t('Creado')} value={formatDate(event.createdAt, language)} />
            <DetailItem label={t('Actualizado')} value={formatDate(event.updatedAt, language)} />
            <DetailItem label={t('Imagen')} value={event.thumbnail ?? t('Sin imagen')} />
            <DetailItem label={t('Estado')} value={event.visibleOnWebsite ? t('Publicado') : t('No publicado')} />
            <div className="sm:col-span-2">
              <dt className="text-xs font-bold uppercase tracking-wide text-stone-500">{t('Descripcion')}</dt>
              <dd className="mt-1 whitespace-pre-wrap text-sm leading-6 text-stone-800">
                {event.description || t('Sin descripcion disponible.')}
              </dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-xs font-bold uppercase tracking-wide text-stone-500">{t('Enlaces')}</dt>
              {urls.length === 0 ? (
                <dd className="mt-1 text-sm text-stone-900">{t('Sin enlaces')}</dd>
              ) : (
                <dd className="mt-2 flex flex-col gap-2">
                  {urls.map((url) => <UrlItem key={url.id} url={url} />)}
                </dd>
              )}
            </div>
          </dl>
        </section>

        <aside className="space-y-3">
          <p className="text-sm font-bold text-stone-950">{t('Vista previa')}</p>
          {!event.visibleOnWebsite && (
            <p className="rounded-md bg-stone-100 p-3 text-sm font-medium text-stone-700">
              {t('Este evento no esta publicado en el sitio web. La vista previa solo es para administracion.')}
            </p>
          )}
          <EventPreviewCard event={previewPayload} categories={categories} thumbnailUrl={thumbnailUrl} primaryUrl={urls[0]} />
        </aside>
      </div>

      <section className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-bold text-stone-950">{t('Horarios conectados')}</h3>
            <p className="mt-1 text-sm text-stone-600">{t('Fechas asociadas a este evento desde el API de horarios.')}</p>
          </div>
          {isOwner && (
            <ButtonLink to={`/admin/events/${event.id}/schedules`} variant="secondary">
              {t('Administrar horarios')}
            </ButtonLink>
          )}
        </div>

        {schedules.length === 0 ? (
          <p className="mt-4 text-sm text-stone-600">{t('Este evento todavia no tiene horarios conectados.')}</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full divide-y divide-stone-200 text-sm">
              <thead className="bg-stone-50 text-left text-xs font-bold uppercase tracking-wide text-stone-500">
                <tr>
                  <th className="px-4 py-3">{t('Inicio')}</th>
                  <th className="px-4 py-3">{t('Fin')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200">
                {schedules.map((schedule) => (
                  <tr key={schedule.id}>
                    <td className="px-4 py-3 text-stone-700">{formatDate(schedule.startDate, language)}</td>
                    <td className="px-4 py-3 text-stone-700">{formatDate(schedule.endDate, language)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <ConfirmDialog
        open={confirmOpen}
        title={t('Eliminar evento')}
        description={t('Estas seguro de que deseas eliminar este evento? El backend aplicara borrado logico para eventos.')}
        loading={deleting}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={handleDelete}
      />
    </div>
  );
}

type DetailNavigationState = {
  source?: 'metrics';
  metricsState?: unknown;
  message?: string;
};

function readDetailNavigationState(state: unknown): DetailNavigationState {
  if (!state || typeof state !== 'object') {
    return {};
  }
  const value = state as Record<string, unknown>;
  return {
    source: value.source === 'metrics' ? 'metrics' : undefined,
    metricsState: value.metricsState,
    message: typeof value.message === 'string' ? value.message : undefined,
  };
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

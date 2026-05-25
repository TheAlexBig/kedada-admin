import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

import { getEventById, updateEvent } from '../../api/eventService';
import { getApiErrorMessage } from '../../api/httpClient';
import { createSchedule, deleteSchedule, getSchedulesForEvent, updateSchedule } from '../../api/scheduleService';
import { createUrl, deleteUrl, getUrlsForEvent, updateUrl } from '../../api/urlService';
import { LoadingState } from '../../components/common/LoadingState';
import { ErrorState } from '../../components/common/StatusMessage';
import { ButtonLink } from '../../components/common/Button';
import { useAuth } from '../../auth/useAuth';
import type { EventPayload, EventResponse, ScheduleResponse, UrlResponse } from '../../types/event';
import { EventForm, type EventScheduleValue, type EventUrlValue } from './EventForm';
import { useI18n } from '../../i18n/I18nContext';

export function EventEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { language, t } = useI18n();
  const { session } = useAuth();
  const [event, setEvent] = useState<EventResponse | null>(null);
  const [schedules, setSchedules] = useState<ScheduleResponse[]>([]);
  const [urls, setUrls] = useState<UrlResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigationState = readEditNavigationState(location.state);
  const fromMetrics = navigationState.source === 'metrics';
  const detailState = fromMetrics
    ? { source: 'metrics', metricsState: navigationState.metricsState }
    : undefined;

  useEffect(() => {
    async function loadEvent() {
      if (!id) {
        return;
      }

      try {
        setLoading(true);
        const loadedEvent = await getEventById(id);
        const ownsEvent = loadedEvent.ownerId === session?.userId;
        const [loadedSchedules, loadedUrls] = ownsEvent
          ? await Promise.all([getSchedulesForEvent(id), getUrlsForEvent(id)])
          : [{ content: [] }, { content: [] }];
        setEvent(loadedEvent);
        setSchedules(loadedSchedules.content);
        setUrls(loadedUrls.content);
        setError(null);
      } catch (loadError) {
        setError(getApiErrorMessage(loadError, language));
      } finally {
        setLoading(false);
      }
    }

    void loadEvent();
  }, [id, language, session?.userId]);

  async function handleUpdate(payload: EventPayload, nextSchedules: EventScheduleValue[], nextUrls: EventUrlValue[]) {
    if (!id) {
      return;
    }

    const updatedEvent = await updateEvent(id, payload);
    if (event?.ownerId !== session?.userId) {
      navigate(`/admin/events/${updatedEvent.id}`, { state: { ...detailState, message: t('Evento actualizado correctamente') } });
      return;
    }

    const retainedIds = new Set(nextSchedules.flatMap((schedule) => schedule.id ? [schedule.id] : []));
    await Promise.all(
      nextSchedules.map((schedule) => {
        const schedulePayload = {
          eventId: id,
          startDate: schedule.startDate,
          endDate: schedule.endDate,
        };

        return schedule.id ? updateSchedule(schedule.id, schedulePayload) : createSchedule(schedulePayload);
      }),
    );
    await Promise.all(
      schedules.filter((schedule) => !retainedIds.has(schedule.id)).map((schedule) => deleteSchedule(schedule.id)),
    );
    const retainedUrlIds = new Set(nextUrls.flatMap((url) => url.id ? [url.id] : []));

    await Promise.all(
      nextUrls.map((url) => {
        const urlPayload = { eventId: id, url: url.url, description: url.description, kind: url.kind };
        return url.id ? updateUrl(url.id, urlPayload) : createUrl(urlPayload);
      }),
    );
    await Promise.all(
      urls.filter((url) => !retainedUrlIds.has(url.id)).map((url) => deleteUrl(url.id)),
    );
    navigate(`/admin/events/${updatedEvent.id}`, { state: { ...detailState, message: t('Evento actualizado correctamente') } });
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
      <ButtonLink to={fromMetrics ? `/admin/events/${event.id}` : '/admin/events'} state={detailState} variant="ghost">
        <ArrowLeft className="h-4 w-4" /> {fromMetrics ? t('Volver al detalle') : t('Volver a eventos')}
      </ButtonLink>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-2xl font-black text-stone-950">{t('Editar evento')}</h2>
          <p className="mt-1 text-sm text-stone-600">{t('Actualiza la informacion del evento.')}</p>
        </div>
      </div>
      <EventForm
        initialEvent={event}
        initialSchedules={schedules}
        initialUrls={urls}
        manageRelated={isOwner}
        submitLabel={t('Guardar')}
        successMessage={t('Evento actualizado correctamente')}
        cancelTo={fromMetrics ? `/admin/events/${event.id}` : '/admin/events'}
        cancelState={detailState}
        onSubmit={handleUpdate}
      />
    </div>
  );
}

type EditNavigationState = {
  source?: 'metrics';
  metricsState?: unknown;
};

function readEditNavigationState(state: unknown): EditNavigationState {
  if (!state || typeof state !== 'object') {
    return {};
  }
  const value = state as Record<string, unknown>;
  return {
    source: value.source === 'metrics' ? 'metrics' : undefined,
    metricsState: value.metricsState,
  };
}

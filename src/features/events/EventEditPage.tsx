import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { getEventById, updateEvent, updateEventVisibility } from '../../api/eventService';
import { getApiErrorMessage } from '../../api/httpClient';
import { createSchedule, deleteSchedule, getSchedulesForEvent, updateSchedule } from '../../api/scheduleService';
import { createUrl, deleteUrl, getUrlsForEvent, updateUrl } from '../../api/urlService';
import { LoadingState } from '../../components/common/LoadingState';
import { ErrorState } from '../../components/common/StatusMessage';
import { Button, ButtonLink } from '../../components/common/Button';
import { useAuth } from '../../auth/useAuth';
import type { EventPayload, EventResponse, ScheduleResponse, UrlResponse } from '../../types/event';
import { EventForm, type EventScheduleValue, type EventUrlValue } from './EventForm';
import { useI18n } from '../../i18n/I18nContext';

export function EventEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { language, t } = useI18n();
  const { session } = useAuth();
  const [event, setEvent] = useState<EventResponse | null>(null);
  const [schedules, setSchedules] = useState<ScheduleResponse[]>([]);
  const [urls, setUrls] = useState<UrlResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [visibilitySaving, setVisibilitySaving] = useState(false);

  useEffect(() => {
    async function loadEvent() {
      if (!id) {
        return;
      }

      try {
        setLoading(true);
        const [loadedEvent, loadedSchedules, loadedUrls] = await Promise.all([
          getEventById(id),
          getSchedulesForEvent(id),
          getUrlsForEvent(id),
        ]);
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
  }, [id, language]);

  async function handleUpdate(payload: EventPayload, nextSchedules: EventScheduleValue[], nextUrls: EventUrlValue[]) {
    if (!id) {
      return;
    }

    const updatedEvent = await updateEvent(id, payload);
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
    navigate(`/admin/events/${updatedEvent.id}`, { state: { message: t('Evento actualizado correctamente') } });
  }

  async function handleVisibilityUpdate() {
    if (!id || !event) {
      return;
    }

    try {
      setVisibilitySaving(true);
      setError(null);
      const updatedEvent = await updateEventVisibility(id, !event.visibleOnWebsite);
      navigate(`/admin/events/${updatedEvent.id}`, { state: { message: t('Visibilidad del evento actualizada correctamente') } });
    } catch (updateError) {
      setError(getApiErrorMessage(updateError, language));
    } finally {
      setVisibilitySaving(false);
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

  if (!isOwner) {
    return (
      <div className="space-y-5">
        <div>
          <h2 className="text-2xl font-black text-stone-950">{t('Editar visibilidad')}</h2>
          <p className="mt-1 text-sm text-stone-600">{t('Este evento pertenece a otro publicador. Solo puedes administrar su visibilidad en el sitio web.')}</p>
        </div>
        <section className="space-y-4 rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
          <div>
            <p className="text-sm font-semibold text-stone-500">{t('Evento')}</p>
            <p className="mt-1 text-lg font-bold text-stone-950">{event.title}</p>
          </div>
          <p className="text-sm text-stone-700">
            {event.visibleOnWebsite
              ? t('Este evento actualmente es visible en el sitio web.')
              : t('Este evento actualmente esta oculto del sitio web.')}
          </p>
          <div className="flex flex-wrap justify-end gap-3 border-t border-stone-200 pt-5">
            <ButtonLink to={`/admin/events/${event.id}`} variant="secondary">{t('Cancelar')}</ButtonLink>
            <Button type="button" disabled={visibilitySaving} onClick={() => void handleVisibilityUpdate()}>
              {visibilitySaving
                ? t('Guardando...')
                : event.visibleOnWebsite ? t('Ocultar del sitio web') : t('Mostrar en el sitio web')}
            </Button>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-black text-stone-950">{t('Editar evento')}</h2>
        <p className="mt-1 text-sm text-stone-600">{t('Actualiza la informacion del evento.')}</p>
      </div>
      <EventForm
        initialEvent={event}
        initialSchedules={schedules}
        initialUrls={urls}
        submitLabel={t('Guardar')}
        successMessage={t('Evento actualizado correctamente')}
        onSubmit={handleUpdate}
      />
    </div>
  );
}

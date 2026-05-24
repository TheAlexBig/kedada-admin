import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { getEventById, updateEvent } from '../../api/eventService';
import { getApiErrorMessage } from '../../api/httpClient';
import { createSchedule, deleteSchedule, getSchedulesForEvent, updateSchedule } from '../../api/scheduleService';
import { createUrl, deleteUrl, getUrlsForEvent, updateUrl } from '../../api/urlService';
import { LoadingState } from '../../components/common/LoadingState';
import { ErrorState } from '../../components/common/StatusMessage';
import type { EventPayload, EventResponse, ScheduleResponse, UrlResponse } from '../../types/event';
import { EventForm, type EventScheduleValue, type EventUrlValue } from './EventForm';
import { useI18n } from '../../i18n/I18nContext';

export function EventEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { language, t } = useI18n();
  const [event, setEvent] = useState<EventResponse | null>(null);
  const [schedules, setSchedules] = useState<ScheduleResponse[]>([]);
  const [urls, setUrls] = useState<UrlResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  if (loading) {
    return <LoadingState label={t('Cargando evento...')} />;
  }

  if (error) {
    return <ErrorState message={error} />;
  }

  if (!event) {
    return <ErrorState message={t('No encontramos el evento solicitado.')} />;
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

import { useNavigate } from 'react-router-dom';

import { createEvent } from '../../api/eventService';
import { createSchedule } from '../../api/scheduleService';
import { createUrl } from '../../api/urlService';
import type { EventPayload } from '../../types/event';
import { EventForm, type EventScheduleValue, type EventUrlValue } from './EventForm';
import { useI18n } from '../../i18n/I18nContext';

export function EventCreatePage() {
  const navigate = useNavigate();
  const { t } = useI18n();

  async function handleCreate(payload: EventPayload, schedules: EventScheduleValue[], urls: EventUrlValue[]) {
    const event = await createEvent(payload);
    await Promise.all(
      [
        ...schedules.map((schedule) =>
          createSchedule({ eventId: event.id, startDate: schedule.startDate, endDate: schedule.endDate }),
        ),
        ...urls.map((url) => createUrl({ ...url, eventId: event.id })),
      ],
    );
    navigate(`/admin/events/${event.id}`, { state: { message: t('Evento creado correctamente') } });
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-black text-stone-950">{t('Crear evento')}</h2>
        <p className="mt-1 text-sm text-stone-600">{t('Completa la informacion publica del evento.')}</p>
      </div>
      <EventForm submitLabel={t('Guardar')} successMessage={t('Evento creado correctamente')} onSubmit={handleCreate} />
    </div>
  );
}

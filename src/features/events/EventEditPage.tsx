import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { getEventById, updateEvent } from '../../api/eventService';
import { getApiErrorMessage } from '../../api/httpClient';
import { LoadingState } from '../../components/common/LoadingState';
import { ErrorState } from '../../components/common/StatusMessage';
import type { EventPayload, EventResponse } from '../../types/event';
import { EventForm } from './EventForm';

export function EventEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState<EventResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadEvent() {
      if (!id) {
        return;
      }

      try {
        setLoading(true);
        setEvent(await getEventById(id));
        setError(null);
      } catch (loadError) {
        setError(getApiErrorMessage(loadError));
      } finally {
        setLoading(false);
      }
    }

    void loadEvent();
  }, [id]);

  async function handleUpdate(payload: EventPayload) {
    if (!id) {
      return;
    }

    const updatedEvent = await updateEvent(id, payload);
    navigate(`/admin/events/${updatedEvent.id}`, { state: { message: 'Evento actualizado correctamente' } });
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
      <div>
        <h2 className="text-2xl font-black text-stone-950">Editar evento</h2>
        <p className="mt-1 text-sm text-stone-600">Actualiza la informacion del evento.</p>
      </div>
      <EventForm
        initialEvent={event}
        submitLabel="Guardar"
        successMessage="Evento actualizado correctamente"
        onSubmit={handleUpdate}
      />
    </div>
  );
}

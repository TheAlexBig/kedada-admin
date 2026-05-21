import { useNavigate } from 'react-router-dom';

import { createEvent } from '../../api/eventService';
import type { EventPayload } from '../../types/event';
import { EventForm } from './EventForm';

export function EventCreatePage() {
  const navigate = useNavigate();

  async function handleCreate(payload: EventPayload) {
    const event = await createEvent(payload);
    navigate(`/admin/events/${event.id}`, { state: { message: 'Evento creado correctamente' } });
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-black text-stone-950">Crear evento</h2>
        <p className="mt-1 text-sm text-stone-600">Completa la informacion publica del evento.</p>
      </div>
      <EventForm submitLabel="Guardar" successMessage="Evento creado correctamente" onSubmit={handleCreate} />
    </div>
  );
}

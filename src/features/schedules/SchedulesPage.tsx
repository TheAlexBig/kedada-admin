import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { ArrowLeft, Pencil, Trash2, X } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';

import { getEventById, getEvents } from '../../api/eventService';
import { getApiErrorMessage } from '../../api/httpClient';
import { createSchedule, deleteSchedule, getSchedules, getSchedulesForEvent, updateSchedule } from '../../api/scheduleService';
import { Button } from '../../components/common/Button';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { EmptyState } from '../../components/common/EmptyState';
import { Input } from '../../components/common/Input';
import { LoadingState } from '../../components/common/LoadingState';
import { Select } from '../../components/common/Select';
import { ErrorState, SuccessMessage } from '../../components/common/StatusMessage';
import type { EventResponse, ScheduleResponse } from '../../types/event';
import { formatDate } from '../../utils/formatters';

type ScheduleFormState = {
  eventId: string;
  startDate: string;
  endDate: string;
};

const emptyForm: ScheduleFormState = {
  eventId: '',
  startDate: '',
  endDate: '',
};

function toDateTimeLocal(value: string | null | undefined) {
  if (!value) {
    return '';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return offsetDate.toISOString().slice(0, 16);
}

function toIsoDate(value: string) {
  return new Date(value).toISOString();
}

function fromSchedule(schedule: ScheduleResponse): ScheduleFormState {
  return {
    eventId: schedule.eventId ?? '',
    startDate: toDateTimeLocal(schedule.startDate),
    endDate: toDateTimeLocal(schedule.endDate),
  };
}

export function SchedulesPage() {
  const { eventId } = useParams();
  const isEventScoped = Boolean(eventId);
  const [schedules, setSchedules] = useState<ScheduleResponse[]>([]);
  const [events, setEvents] = useState<EventResponse[]>([]);
  const [parentEvent, setParentEvent] = useState<EventResponse | null>(null);
  const [form, setForm] = useState<ScheduleFormState>(() => ({ ...emptyForm, eventId: eventId ?? '' }));
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof ScheduleFormState, string>>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ScheduleResponse | null>(null);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const eventById = useMemo(
    () => new Map(events.map((event) => [event.id, event.title])),
    [events],
  );

  const loadSchedules = useCallback(async (nextPage = page) => {
    try {
      setLoading(true);
      const schedulePage = eventId
        ? await getSchedulesForEvent(eventId)
        : await getSchedules({ page: nextPage, size: 10, sort: 'startDate,asc' });
      setSchedules(schedulePage.content);
      setTotalPages(schedulePage.totalPages);
      setError(null);
    } catch (loadError) {
      setError(getApiErrorMessage(loadError));
    } finally {
      setLoading(false);
    }
  }, [eventId, page]);

  useEffect(() => {
    async function loadEvents() {
      try {
        if (eventId) {
          const loadedEvent = await getEventById(eventId);
          setParentEvent(loadedEvent);
          setEvents([loadedEvent]);
          setForm((current) => ({ ...current, eventId }));
          return;
        }

        const eventPage = await getEvents({ page: 0, size: 100, sort: 'title,asc' });
        setEvents(eventPage.content);
      } catch {
        setEvents([]);
      }
    }

    void loadEvents();
  }, [eventId]);

  useEffect(() => {
    void loadSchedules(page);
  }, [loadSchedules, page]);

  function updateField(name: keyof ScheduleFormState, value: string) {
    setForm((current) => ({ ...current, [name]: value }));
    setFieldErrors((current) => ({ ...current, [name]: undefined }));
    setSuccess(null);
  }

  function resetForm() {
    setForm({ ...emptyForm, eventId: eventId ?? '' });
    setEditingId(null);
    setFieldErrors({});
  }

  function validate() {
    const nextErrors: Partial<Record<keyof ScheduleFormState, string>> = {};

    if (!form.startDate) {
      nextErrors.startDate = 'La fecha de inicio es requerida.';
    }

    if (form.endDate && form.startDate && new Date(form.endDate) <= new Date(form.startDate)) {
      nextErrors.endDate = 'La fecha final debe ser posterior al inicio.';
    }

    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!validate()) {
      return;
    }

    const wasEditing = Boolean(editingId);
    const payload = {
      eventId: eventId ?? (form.eventId || null),
      startDate: toIsoDate(form.startDate),
      endDate: form.endDate ? toIsoDate(form.endDate) : null,
    };

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      if (editingId) {
        await updateSchedule(editingId, payload);
      } else {
        await createSchedule(payload);
      }

      resetForm();
      setSuccess(wasEditing ? 'Schedule actualizado correctamente.' : 'Schedule creado correctamente.');
      await loadSchedules(page);
    } catch (saveError) {
      setError(getApiErrorMessage(saveError));
    } finally {
      setSaving(false);
    }
  }

  function startEdit(schedule: ScheduleResponse) {
    setEditingId(schedule.id);
    setForm(fromSchedule(schedule));
    setFieldErrors({});
    setSuccess(null);
    setError(null);
  }

  async function confirmDelete() {
    if (!deleteTarget) {
      return;
    }

    try {
      setDeleting(true);
      setError(null);
      setSuccess(null);
      await deleteSchedule(deleteTarget.id);
      setDeleteTarget(null);
      if (editingId === deleteTarget.id) {
        resetForm();
      }
      setSuccess('Schedule eliminado correctamente.');
      await loadSchedules(page);
    } catch (deleteError) {
      setError(getApiErrorMessage(deleteError));
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-5">
      <div>
        {isEventScoped && (
          <Link className="mb-3 inline-flex items-center gap-1 text-sm font-semibold text-rose-700" to={`/admin/events/${eventId}`}>
            <ArrowLeft className="h-4 w-4" /> Volver al evento
          </Link>
        )}
        <h2 className="text-2xl font-black text-stone-950">
          {parentEvent ? `Schedules: ${parentEvent.title}` : 'Schedules'}
        </h2>
        <p className="mt-1 text-sm text-stone-600">
          {isEventScoped
            ? 'Administra solamente las fechas conectadas a este evento.'
            : 'Administra fechas de eventos conectadas al endpoint /api/v1/schedules.'}
        </p>
      </div>

      <form className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm" onSubmit={handleSave}>
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-bold text-stone-950">
              {editingId ? 'Editar schedule' : 'Crear schedule'}
            </h3>
            <p className="mt-1 text-sm text-stone-600">Conecta una fecha con un evento publicado.</p>
          </div>
          {editingId && (
            <Button type="button" variant="ghost" onClick={resetForm}>
              <X className="h-4 w-4" /> Cancelar edicion
            </Button>
          )}
        </div>

        <div className="grid gap-4 lg:grid-cols-[1fr_220px_220px_auto]">
          <Select
            label="Evento"
            name="eventId"
            value={form.eventId}
            disabled={isEventScoped}
            helperText={isEventScoped ? 'Este schedule pertenece al evento seleccionado.' : 'Selecciona el evento de esta fecha.'}
            onChange={(event) => updateField('eventId', event.target.value)}
          >
            {!isEventScoped && <option value="">Sin evento conectado</option>}
            {events.map((event) => (
              <option key={event.id} value={event.id}>
                {event.title}
              </option>
            ))}
          </Select>
          <Input
            label="Inicio"
            name="startDate"
            type="datetime-local"
            required
            value={form.startDate}
            error={fieldErrors.startDate}
            onChange={(event) => updateField('startDate', event.target.value)}
          />
          <Input
            label="Fin"
            name="endDate"
            type="datetime-local"
            value={form.endDate}
            error={fieldErrors.endDate}
            onChange={(event) => updateField('endDate', event.target.value)}
          />
          <div className="flex items-end">
            <Button type="submit" className="w-full" disabled={saving}>
              {saving ? 'Guardando...' : editingId ? 'Actualizar' : 'Guardar'}
            </Button>
          </div>
        </div>
      </form>

      {success && <SuccessMessage message={success} />}
      {error && <ErrorState message={error} />}
      {loading ? (
        <LoadingState label="Cargando schedules..." />
      ) : schedules.length === 0 ? (
        <EmptyState title="No hay schedules" description="Crea el primer schedule para conectar fechas con eventos." />
      ) : (
        <div className="overflow-hidden rounded-lg border border-stone-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-stone-200 text-sm">
              <thead className="bg-stone-50 text-left text-xs font-bold uppercase tracking-wide text-stone-500">
                <tr>
                  <th className="px-4 py-3">Evento</th>
                  <th className="px-4 py-3">Inicio</th>
                  <th className="px-4 py-3">Fin</th>
                  <th className="px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200">
                {schedules.map((schedule) => (
                  <tr key={schedule.id} className="hover:bg-stone-50">
                    <td className="px-4 py-3 font-semibold text-stone-950">
                      {schedule.eventId ? (
                        <Link className="text-rose-700 hover:text-rose-800" to={`/admin/events/${schedule.eventId}`}>
                          {eventById.get(schedule.eventId) ?? schedule.eventId}
                        </Link>
                      ) : (
                        'Sin evento'
                      )}
                    </td>
                    <td className="px-4 py-3 text-stone-700">{formatDate(schedule.startDate)}</td>
                    <td className="px-4 py-3 text-stone-700">{formatDate(schedule.endDate)}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <button
                          className="rounded-md p-2 text-stone-600 hover:bg-stone-100"
                          type="button"
                          title="Editar"
                          onClick={() => startEdit(schedule)}
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          className="rounded-md p-2 text-red-600 hover:bg-red-50"
                          type="button"
                          title="Eliminar"
                          onClick={() => setDeleteTarget(schedule)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!isEventScoped && <div className="flex items-center justify-between border-t border-stone-200 px-4 py-3 text-sm text-stone-600">
            <Button type="button" variant="secondary" disabled={page === 0} onClick={() => setPage((current) => current - 1)}>
              Anterior
            </Button>
            <span>
              Pagina {page + 1} de {Math.max(totalPages, 1)}
            </span>
            <Button
              type="button"
              variant="secondary"
              disabled={page + 1 >= totalPages}
              onClick={() => setPage((current) => current + 1)}
            >
              Siguiente
            </Button>
          </div>}
        </div>
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Eliminar schedule"
        description="¿Estas seguro de que deseas eliminar este schedule?"
        loading={deleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}

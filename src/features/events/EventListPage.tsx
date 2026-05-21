import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { Eye, Pencil, Plus, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';

import { deleteEvent, getEvents } from '../../api/eventService';
import { getEventTypes } from '../../api/eventTypeService';
import { getApiErrorMessage } from '../../api/httpClient';
import { Button, ButtonLink } from '../../components/common/Button';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { EmptyState } from '../../components/common/EmptyState';
import { Input } from '../../components/common/Input';
import { LoadingState } from '../../components/common/LoadingState';
import { Select } from '../../components/common/Select';
import { ErrorState, SuccessMessage } from '../../components/common/StatusMessage';
import type { CategoryResponse, EventResponse } from '../../types/event';
import { formatCurrency, formatDate, getStatusLabel } from '../../utils/formatters';

export function EventListPage() {
  const [events, setEvents] = useState<EventResponse[]>([]);
  const [categories, setCategories] = useState<CategoryResponse[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(0);
  const [query, setQuery] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [sort, setSort] = useState('createdAt,desc');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<EventResponse | null>(null);
  const [deleting, setDeleting] = useState(false);

  const categoryById = useMemo(
    () => new Map(categories.map((category) => [category.id, category.name])),
    [categories],
  );

  const loadEvents = useCallback(async (nextPage = page) => {
    try {
      setLoading(true);
      const eventPage = await getEvents({
        page: nextPage,
        size: 10,
        sort,
        q: query,
        categoryId,
      });
      setEvents(eventPage.content);
      setTotalPages(eventPage.totalPages);
      setError(null);
    } catch (loadError) {
      setError(getApiErrorMessage(loadError));
    } finally {
      setLoading(false);
    }
  }, [categoryId, page, query, sort]);

  useEffect(() => {
    async function loadCategories() {
      try {
        const categoryPage = await getEventTypes();
        setCategories(categoryPage.content);
      } catch {
        setCategories([]);
      }
    }

    void loadCategories();
  }, []);

  useEffect(() => {
    void loadEvents(page);
  }, [loadEvents, page, sort]);

  async function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPage(0);
    await loadEvents(0);
  }

  async function confirmDelete() {
    if (!deleteTarget) {
      return;
    }

    try {
      setDeleting(true);
      await deleteEvent(deleteTarget.id);
      setSuccess('Evento eliminado correctamente.');
      setDeleteTarget(null);
      await loadEvents(page);
    } catch (deleteError) {
      setError(getApiErrorMessage(deleteError));
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-black text-stone-950">Eventos</h2>
          <p className="mt-1 text-sm text-stone-600">Busca, revisa y administra eventos publicados.</p>
        </div>
        <ButtonLink to="/admin/events/new">
          <Plus className="h-4 w-4" /> Crear evento
        </ButtonLink>
      </div>

      <form className="grid gap-3 rounded-lg border border-stone-200 bg-white p-4 shadow-sm md:grid-cols-[1fr_220px_220px_auto]" onSubmit={handleSearch}>
        <Input
          label="Buscar"
          name="q"
          placeholder="Titulo o descripcion"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <Select label="Tipo de evento" name="categoryId" value={categoryId} onChange={(event) => setCategoryId(event.target.value)}>
          <option value="">Todos</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </Select>
        <Select label="Ordenar" name="sort" value={sort} onChange={(event) => setSort(event.target.value)}>
          <option value="createdAt,desc">Mas recientes</option>
          <option value="createdAt,asc">Mas antiguos</option>
          <option value="priority,desc">Prioridad alta</option>
          <option value="title,asc">Titulo A-Z</option>
        </Select>
        <div className="flex items-end">
          <Button type="submit" className="w-full">
            Buscar
          </Button>
        </div>
      </form>

      {success && <SuccessMessage message={success} />}
      {error && <ErrorState message={error} />}
      {loading ? (
        <LoadingState label="Cargando eventos..." />
      ) : events.length === 0 ? (
        <EmptyState title="No se encontraron eventos" description="Prueba con otra busqueda o crea un nuevo evento." />
      ) : (
        <div className="overflow-hidden rounded-lg border border-stone-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-stone-200 text-sm">
              <thead className="bg-stone-50 text-left text-xs font-bold uppercase tracking-wide text-stone-500">
                <tr>
                  <th className="px-4 py-3">Titulo</th>
                  <th className="px-4 py-3">Tipo</th>
                  <th className="px-4 py-3">Prioridad</th>
                  <th className="px-4 py-3">Precio</th>
                  <th className="px-4 py-3">Fecha de creacion</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200">
                {events.map((event) => (
                  <tr key={event.id} className="hover:bg-stone-50">
                    <td className="px-4 py-3 font-semibold text-stone-950">{event.title}</td>
                    <td className="px-4 py-3 text-stone-700">{categoryById.get(event.categoryId) ?? 'Sin tipo'}</td>
                    <td className="px-4 py-3 text-stone-700">{event.priority ?? 1}</td>
                    <td className="px-4 py-3 text-stone-700">{formatCurrency(event.price)}</td>
                    <td className="px-4 py-3 text-stone-700">{formatDate(event.createdAt)}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-md bg-teal-50 px-2.5 py-1 text-xs font-semibold text-teal-800">
                        {getStatusLabel()}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <Link className="rounded-md p-2 text-stone-600 hover:bg-stone-100" to={`/admin/events/${event.id}`} title="Ver">
                          <Eye className="h-4 w-4" />
                        </Link>
                        <Link className="rounded-md p-2 text-stone-600 hover:bg-stone-100" to={`/admin/events/${event.id}/edit`} title="Editar">
                          <Pencil className="h-4 w-4" />
                        </Link>
                        <button
                          className="rounded-md p-2 text-red-600 hover:bg-red-50"
                          type="button"
                          title="Eliminar"
                          onClick={() => setDeleteTarget(event)}
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
          <div className="flex items-center justify-between border-t border-stone-200 px-4 py-3 text-sm text-stone-600">
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
          </div>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Eliminar evento"
        description="¿Estas seguro de que deseas eliminar este evento? El backend aplicara borrado logico para eventos."
        loading={deleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}

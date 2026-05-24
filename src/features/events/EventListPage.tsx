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
import { useI18n } from '../../i18n/I18nContext';

export function EventListPage() {
  const { language, t } = useI18n();
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
      setError(getApiErrorMessage(loadError, language));
    } finally {
      setLoading(false);
    }
  }, [categoryId, language, page, query, sort]);

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
      setSuccess(t('Evento eliminado correctamente.'));
      setDeleteTarget(null);
      await loadEvents(page);
    } catch (deleteError) {
      setError(getApiErrorMessage(deleteError, language));
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-black text-stone-950">{t('Eventos')}</h2>
          <p className="mt-1 text-sm text-stone-600">{t('Busca, revisa y administra eventos publicados.')}</p>
        </div>
        <ButtonLink to="/admin/events/new">
          <Plus className="h-4 w-4" /> {t('Crear evento')}
        </ButtonLink>
      </div>

      <form className="grid gap-3 rounded-lg border border-stone-200 bg-white p-4 shadow-sm md:grid-cols-[1fr_220px_220px_auto]" onSubmit={handleSearch}>
        <Input
          label={t('Buscar')}
          name="q"
          placeholder={t('Titulo o descripcion')}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <Select label={t('Tipo de evento')} name="categoryId" value={categoryId} onChange={(event) => setCategoryId(event.target.value)}>
          <option value="">{t('Todos')}</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </Select>
        <Select label={t('Ordenar')} name="sort" value={sort} onChange={(event) => setSort(event.target.value)}>
          <option value="createdAt,desc">{t('Mas recientes')}</option>
          <option value="createdAt,asc">{t('Mas antiguos')}</option>
          <option value="priority,desc">{t('Prioridad alta')}</option>
          <option value="title,asc">{t('Titulo')} A-Z</option>
        </Select>
        <div className="flex items-end">
          <Button type="submit" className="w-full">
            {t('Buscar')}
          </Button>
        </div>
      </form>

      {success && <SuccessMessage message={success} />}
      {error && <ErrorState message={error} />}
      {loading ? (
        <LoadingState label={t('Cargando eventos...')} />
      ) : events.length === 0 ? (
        <EmptyState title={t('No se encontraron eventos')} description={t('Prueba con otra busqueda o crea un nuevo evento.')} />
      ) : (
        <div className="overflow-hidden rounded-lg border border-stone-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-stone-200 text-sm">
              <thead className="bg-stone-50 text-left text-xs font-bold uppercase tracking-wide text-stone-500">
                <tr>
                  <th className="px-4 py-3">{t('Titulo')}</th>
                  <th className="px-4 py-3">{t('Tipos')}</th>
                  <th className="px-4 py-3">{t('Prioridad')}</th>
                  <th className="px-4 py-3">{t('Precio')}</th>
                  <th className="px-4 py-3">{t('Fecha de creacion')}</th>
                  <th className="px-4 py-3">{t('Estado')}</th>
                  <th className="px-4 py-3 text-right">{t('Acciones')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200">
                {events.map((event) => (
                  <tr key={event.id} className="hover:bg-stone-50">
                    <td className="px-4 py-3 font-semibold text-stone-950">{event.title}</td>
                    <td className="px-4 py-3 text-stone-700">
                      {event.categoryIds.map((categoryId) => categoryById.get(categoryId)).filter(Boolean).join(', ') || t('Sin tipo')}
                    </td>
                    <td className="px-4 py-3 text-stone-700">{event.priority ?? 1}</td>
                    <td className="px-4 py-3 text-stone-700">{formatCurrency(event.price, language)}</td>
                    <td className="px-4 py-3 text-stone-700">{formatDate(event.createdAt, language)}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-md bg-teal-50 px-2.5 py-1 text-xs font-semibold text-teal-800">
                        {getStatusLabel(language)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <Link className="rounded-md p-2 text-stone-600 hover:bg-stone-100" to={`/admin/events/${event.id}`} title={t('Ver')}>
                          <Eye className="h-4 w-4" />
                        </Link>
                        <Link className="rounded-md p-2 text-stone-600 hover:bg-stone-100" to={`/admin/events/${event.id}/edit`} title={t('Editar')}>
                          <Pencil className="h-4 w-4" />
                        </Link>
                        <button
                          className="rounded-md p-2 text-red-600 hover:bg-red-50"
                          type="button"
                          title={t('Eliminar')}
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
              {t('Anterior')}
            </Button>
            <span>
              {t('Pagina')} {page + 1} {t('de')} {Math.max(totalPages, 1)}
            </span>
            <Button
              type="button"
              variant="secondary"
              disabled={page + 1 >= totalPages}
              onClick={() => setPage((current) => current + 1)}
            >
              {t('Siguiente')}
            </Button>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title={t('Eliminar evento')}
        description={t('Estas seguro de que deseas eliminar este evento? El backend aplicara borrado logico para eventos.')}
        loading={deleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}

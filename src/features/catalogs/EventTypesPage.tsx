import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Pencil, Trash2, X } from 'lucide-react';

import { createEventType, deleteEventType, getEventTypes, updateEventType } from '../../api/eventTypeService';
import { getApiErrorMessage } from '../../api/httpClient';
import { Button } from '../../components/common/Button';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { EmptyState } from '../../components/common/EmptyState';
import { Input } from '../../components/common/Input';
import { LoadingState } from '../../components/common/LoadingState';
import { ErrorState, SuccessMessage } from '../../components/common/StatusMessage';
import type { CategoryResponse } from '../../types/event';
import { useI18n } from '../../i18n/I18nContext';

export function EventTypesPage() {
  const { language, t } = useI18n();
  const [categories, setCategories] = useState<CategoryResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [type, setType] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CategoryResponse | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{
    name?: string;
  }>({});

  const loadCategories = useCallback(async () => {
    try {
      setLoading(true);
      const page = await getEventTypes();
      setCategories(page.content);
      setError(null);
    } catch (loadError) {
      setError(getApiErrorMessage(loadError, language));
    } finally {
      setLoading(false);
    }
  }, [language]);

  useEffect(() => {
    void loadCategories();
  }, [loadCategories]);

  function validate() {
    const nextErrors: typeof fieldErrors = {};

    if (!name.trim()) {
      nextErrors.name = t('El nombre es requerido.');
    }

    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function resetForm() {
    setName('');
    setType('');
    setEditingId(null);
    setFieldErrors({});
  }

  function toPayload() {
    return {
      name: name.trim(),
      type: type
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
    };
  }

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!validate()) {
      return;
    }

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);
      const wasEditing = Boolean(editingId);
      const saved = editingId
        ? await updateEventType(editingId, toPayload())
        : await createEventType(toPayload());

      setCategories((current) => {
        const next = [saved, ...current.filter((category) => category.id !== saved.id)];
        return next.sort((a, b) => a.name.localeCompare(b.name));
      });
      resetForm();
      setSuccess(wasEditing ? t('Tipo de evento actualizado correctamente.') : t('Tipo de evento creado correctamente.'));
    } catch (saveError) {
      setError(getApiErrorMessage(saveError, language));
    } finally {
      setSaving(false);
    }
  }

  function startEdit(category: CategoryResponse) {
    setEditingId(category.id);
    setName(category.name);
    setType(category.type?.join(', ') ?? '');
    setSuccess(null);
    setError(null);
    setFieldErrors({});
  }

  async function confirmDelete() {
    if (!deleteTarget) {
      return;
    }

    try {
      setDeleting(true);
      setError(null);
      setSuccess(null);
      await deleteEventType(deleteTarget.id);
      setCategories((current) => current.filter((category) => category.id !== deleteTarget.id));
      if (editingId === deleteTarget.id) {
        resetForm();
      }
      setDeleteTarget(null);
      setSuccess(t('Tipo de evento eliminado correctamente.'));
    } catch (deleteError) {
      setError(getApiErrorMessage(deleteError, language));
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return <LoadingState label={t('Cargando tipos de evento...')} />;
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-black text-stone-950">{t('Tipos de evento')}</h2>
        <p className="mt-1 text-sm text-stone-600">
          {t('Organiza los eventos por categorias para facilitar su busqueda y publicacion.')}
        </p>
      </div>

      <form className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm" onSubmit={handleSave}>
        <div className="mb-4">
          <h3 className="text-lg font-bold text-stone-950">
            {editingId ? t('Editar tipo de evento') : t('Crear tipo de evento')}
          </h3>
          <p className="mt-1 text-sm text-stone-600">
            {t('Estos tipos apareceran en el selector del formulario de eventos.')}
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1fr_1fr_auto]">
          <Input
            label={t('Nombre')}
            name="name"
            required
            placeholder={t('Conciertos, Teatro, Gastronomia')}
            value={name}
            error={fieldErrors.name}
            onChange={(event) => {
              setName(event.target.value);
              setFieldErrors((current) => ({ ...current, name: undefined }));
            }}
          />
          <Input
            label={t('Clasificacion')}
            name="type"
            placeholder="concert, festival"
            value={type}
            helperText={t('Opcional. Separa varios valores con coma.')}
            onChange={(event) => setType(event.target.value)}
          />
          <div className="flex items-end">
            <Button type="submit" className="w-full" disabled={saving}>
              {saving ? t('Guardando...') : editingId ? t('Actualizar') : t('Guardar')}
            </Button>
          </div>
        </div>

        {editingId && (
          <Button type="button" variant="ghost" onClick={resetForm}>
            <X className="h-4 w-4" /> {t('Cancelar edicion')}
          </Button>
        )}

        <p className="mt-4 text-xs text-stone-500">
          {t('Los usuarios autenticados del panel pueden administrar este catalogo.')}
        </p>
      </form>

      {success && <SuccessMessage message={success} />}
      {error && <ErrorState message={error} />}

      {categories.length === 0 ? (
        <EmptyState title={t('No hay tipos de evento')} description={t('Crea el primer tipo para usarlo en eventos.')} />
      ) : (
        <div className="overflow-hidden rounded-lg border border-stone-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-stone-200 text-sm">
            <thead className="bg-stone-50 text-left text-xs font-bold uppercase tracking-wide text-stone-500">
              <tr>
                <th className="px-4 py-3">{t('Nombre')}</th>
                <th className="px-4 py-3">{t('Clasificacion')}</th>
                <th className="px-4 py-3 text-right">{t('Acciones')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200">
              {categories.map((category) => (
                <tr key={category.id}>
                  <td className="px-4 py-3 font-semibold text-stone-950">{category.name}</td>
                  <td className="px-4 py-3 text-stone-700">{category.type?.join(', ') || t('Sin clasificacion')}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        className="rounded-md p-2 text-stone-600 hover:bg-stone-100"
                        type="button"
                        title={t('Editar')}
                        onClick={() => startEdit(category)}
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        className="rounded-md p-2 text-red-600 hover:bg-red-50"
                        type="button"
                        title={t('Eliminar')}
                        onClick={() => setDeleteTarget(category)}
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
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title={t('Eliminar tipo de evento')}
        description={t('Estas seguro de que deseas eliminar este tipo? Si tiene eventos activos asociados, el backend rechazara la operacion.')}
        loading={deleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}

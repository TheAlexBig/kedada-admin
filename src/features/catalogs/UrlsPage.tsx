import { useEffect, useState, type FormEvent } from 'react';
import { ExternalLink, Pencil, Trash2, X } from 'lucide-react';

import { getApiErrorMessage } from '../../api/httpClient';
import { createUrl, deleteUrl, getUrls, updateUrl } from '../../api/urlService';
import { Button } from '../../components/common/Button';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { EmptyState } from '../../components/common/EmptyState';
import { Input } from '../../components/common/Input';
import { LoadingState } from '../../components/common/LoadingState';
import { ErrorState, SuccessMessage } from '../../components/common/StatusMessage';
import { useAuth } from '../../auth/useAuth';
import type { UrlResponse } from '../../types/event';

type FieldErrors = {
  url?: string;
  kind?: string;
  description?: string;
};

export function UrlsPage() {
  const { session } = useAuth();
  const [urls, setUrls] = useState<UrlResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [url, setUrl] = useState('');
  const [kind, setKind] = useState('');
  const [description, setDescription] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<UrlResponse | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  async function loadUrls() {
    try {
      setLoading(true);
      const page = await getUrls();
      setUrls(page.content);
      setError(null);
    } catch (loadError) {
      setError(getApiErrorMessage(loadError));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadUrls();
  }, []);

  function validate() {
    const nextErrors: FieldErrors = {};
    const trimmedUrl = url.trim();
    const trimmedKind = kind.trim();

    if (!trimmedUrl) {
      nextErrors.url = 'La URL es requerida.';
    } else {
      try {
        new URL(trimmedUrl);
      } catch {
        nextErrors.url = 'Ingresa una URL valida, incluyendo http:// o https://.';
      }
    }

    if (!trimmedKind) {
      nextErrors.kind = 'El tipo es requerido.';
    } else if (trimmedKind.length > 20) {
      nextErrors.kind = 'El tipo debe tener maximo 20 caracteres.';
    }

    if (description.trim().length > 100) {
      nextErrors.description = 'La descripcion debe tener maximo 100 caracteres.';
    }

    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function resetForm() {
    setUrl('');
    setKind('');
    setDescription('');
    setEditingId(null);
    setFieldErrors({});
  }

  function toPayload() {
    return {
      url: url.trim(),
      kind: kind.trim(),
      description: description.trim() || null,
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
      const saved = editingId ? await updateUrl(editingId, toPayload()) : await createUrl(toPayload());

      setUrls((current) => {
        const next = [saved, ...current.filter((item) => item.id !== saved.id)];
        return next.sort((a, b) => (a.kind ?? '').localeCompare(b.kind ?? '') || a.url.localeCompare(b.url));
      });
      resetForm();
      setSuccess(wasEditing ? 'Enlace actualizado correctamente.' : 'Enlace creado correctamente.');
    } catch (saveError) {
      setError(getApiErrorMessage(saveError));
    } finally {
      setSaving(false);
    }
  }

  function startEdit(item: UrlResponse) {
    setEditingId(item.id);
    setUrl(item.url);
    setKind(item.kind ?? '');
    setDescription(item.description ?? '');
    setSuccess(null);
    setError(null);
    setFieldErrors({});
  }

  async function confirmDelete() {
    if (!deleteTarget || deleteTarget.ownerId !== session?.userId) {
      return;
    }

    try {
      setDeleting(true);
      setError(null);
      setSuccess(null);
      await deleteUrl(deleteTarget.id);
      setUrls((current) => current.filter((item) => item.id !== deleteTarget.id));
      if (editingId === deleteTarget.id) {
        resetForm();
      }
      setDeleteTarget(null);
      setSuccess('Enlace eliminado correctamente.');
    } catch (deleteError) {
      setError(getApiErrorMessage(deleteError));
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return <LoadingState label="Cargando enlaces..." />;
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-black text-stone-950">URLs / Enlaces</h2>
        <p className="mt-1 text-sm text-stone-600">
          Administra los enlaces externos que puedes asociar a eventos.
        </p>
      </div>

      <form className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm" onSubmit={handleSave}>
        <div className="mb-4">
          <h3 className="text-lg font-bold text-stone-950">{editingId ? 'Editar enlace' : 'Crear enlace'}</h3>
          <p className="mt-1 text-sm text-stone-600">
            Usa tipos cortos como official, ticket, instagram o reference para organizarlos.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_180px]">
          <Input
            label="URL"
            name="url"
            type="url"
            required
            placeholder="https://example.com/evento"
            value={url}
            error={fieldErrors.url}
            onChange={(event) => {
              setUrl(event.target.value);
              setFieldErrors((current) => ({ ...current, url: undefined }));
            }}
          />
          <Input
            label="Descripcion"
            name="description"
            maxLength={100}
            placeholder="Sitio oficial"
            value={description}
            error={fieldErrors.description}
            helperText="Opcional. Maximo 100 caracteres."
            onChange={(event) => {
              setDescription(event.target.value);
              setFieldErrors((current) => ({ ...current, description: undefined }));
            }}
          />
          <Input
            label="Tipo"
            name="kind"
            required
            maxLength={20}
            placeholder="official"
            value={kind}
            error={fieldErrors.kind}
            onChange={(event) => {
              setKind(event.target.value);
              setFieldErrors((current) => ({ ...current, kind: undefined }));
            }}
          />
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-stone-500">La propiedad del enlace se asigna automaticamente desde tu sesion.</p>
          <div className="flex flex-wrap gap-2">
            {editingId && (
              <Button type="button" variant="ghost" onClick={resetForm}>
                <X className="h-4 w-4" /> Cancelar edicion
              </Button>
            )}
            <Button type="submit" disabled={saving}>
              {saving ? 'Guardando...' : editingId ? 'Actualizar' : 'Guardar'}
            </Button>
          </div>
        </div>
      </form>

      {success && <SuccessMessage message={success} />}
      {error && <ErrorState message={error} />}

      {urls.length === 0 ? (
        <EmptyState title="No hay enlaces" description="Crea el primer enlace para asociarlo a eventos." />
      ) : (
        <div className="overflow-hidden rounded-lg border border-stone-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-stone-200 text-sm">
            <thead className="bg-stone-50 text-left text-xs font-bold uppercase tracking-wide text-stone-500">
              <tr>
                <th className="px-4 py-3">Descripcion</th>
                <th className="px-4 py-3">Tipo</th>
                <th className="px-4 py-3">URL</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200">
              {urls.map((item) => {
                const canManage = item.ownerId === session?.userId;

                return (
                  <tr key={item.id}>
                    <td className="px-4 py-3 font-semibold text-stone-950">
                      <div>{item.description || 'Sin descripcion'}</div>
                      {!canManage && <div className="mt-1 text-xs font-medium text-stone-500">Solo lectura</div>}
                    </td>
                    <td className="px-4 py-3 text-stone-700">{item.kind || 'Sin tipo'}</td>
                    <td className="px-4 py-3">
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex max-w-md items-center gap-1 truncate font-semibold text-rose-700"
                      >
                        {item.url} <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                      </a>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <button
                          className="rounded-md p-2 text-stone-600 hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-40"
                          type="button"
                          title={canManage ? 'Editar' : 'No puedes editar enlaces de otro usuario'}
                          disabled={!canManage}
                          onClick={() => startEdit(item)}
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          className="rounded-md p-2 text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                          type="button"
                          title={canManage ? 'Eliminar' : 'No puedes eliminar enlaces de otro usuario'}
                          disabled={!canManage}
                          onClick={() => setDeleteTarget(item)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Eliminar enlace"
        description="¿Estas seguro de que deseas eliminar este enlace? Si tiene eventos activos asociados, el backend rechazara la operacion."
        loading={deleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}

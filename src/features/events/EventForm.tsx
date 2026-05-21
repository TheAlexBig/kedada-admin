import { useEffect, useMemo, useState, type FormEvent } from 'react';

import { getEventTypes } from '../../api/eventTypeService';
import { getUrls } from '../../api/urlService';
import { Button, ButtonLink } from '../../components/common/Button';
import { ErrorState, SuccessMessage } from '../../components/common/StatusMessage';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { Textarea } from '../../components/common/Textarea';
import type { CategoryResponse, EventPayload, EventResponse, UrlResponse } from '../../types/event';
import { getApiErrorMessage } from '../../api/httpClient';
import { EventPreviewCard } from './EventPreviewCard';

type FormState = {
  title: string;
  description: string;
  priority: string;
  thumbnail: string;
  price: string;
  siteUrlId: string;
  referenceUrlId: string;
  categoryId: string;
};

const emptyForm: FormState = {
  title: '',
  description: '',
  priority: '1',
  thumbnail: '',
  price: '',
  siteUrlId: '',
  referenceUrlId: '',
  categoryId: '',
};

type EventFormProps = {
  initialEvent?: EventResponse;
  submitLabel: string;
  successMessage: string;
  onSubmit: (payload: EventPayload) => Promise<void>;
};

function fromEvent(event?: EventResponse): FormState {
  if (!event) {
    return emptyForm;
  }

  return {
    title: event.title ?? '',
    description: event.description ?? '',
    priority: String(event.priority ?? 1),
    thumbnail: event.thumbnail ?? '',
    price: event.price === null || event.price === undefined ? '' : String(event.price),
    siteUrlId: event.siteUrlId ?? '',
    referenceUrlId: event.referenceUrlId ?? '',
    categoryId: event.categoryId ?? '',
  };
}

export function EventForm({ initialEvent, submitLabel, successMessage, onSubmit }: EventFormProps) {
  const [form, setForm] = useState<FormState>(() => fromEvent(initialEvent));
  const [categories, setCategories] = useState<CategoryResponse[]>([]);
  const [urls, setUrls] = useState<UrlResponse[]>([]);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm(fromEvent(initialEvent));
  }, [initialEvent]);

  useEffect(() => {
    async function loadCatalogs() {
      try {
        const [categoryPage, urlPage] = await Promise.all([getEventTypes(), getUrls()]);
        setCategories(categoryPage.content);
        setUrls(urlPage.content);
        setCatalogError(null);
      } catch (error) {
        setCatalogError(getApiErrorMessage(error));
      }
    }

    void loadCatalogs();
  }, []);

  const selectedCategory = categories.find((category) => category.id === form.categoryId);
  const selectedSiteUrl = urls.find((url) => url.id === form.siteUrlId);

  const previewEvent = useMemo(
    () => ({
      title: form.title,
      description: form.description || null,
      priority: Number(form.priority || 1),
      thumbnail: form.thumbnail || null,
      price: form.price === '' ? null : Number(form.price),
      siteUrlId: form.siteUrlId || null,
      referenceUrlId: form.referenceUrlId || null,
      categoryId: form.categoryId,
      createdAt: initialEvent?.createdAt,
    }),
    [form, initialEvent?.createdAt],
  );

  function updateField(name: keyof FormState, value: string) {
    setForm((current) => ({ ...current, [name]: value }));
    setSaved(false);
    setFieldErrors((current) => ({ ...current, [name]: undefined }));
  }

  function validate() {
    const nextErrors: Partial<Record<keyof FormState, string>> = {};

    if (!form.title.trim()) {
      nextErrors.title = 'El titulo es requerido.';
    } else if (form.title.trim().length > 100) {
      nextErrors.title = 'El titulo debe tener maximo 100 caracteres.';
    }

    if (!form.categoryId) {
      nextErrors.categoryId = 'Selecciona un tipo de evento.';
    }

    if (Number(form.priority) < 1 || Number.isNaN(Number(form.priority))) {
      nextErrors.priority = 'La prioridad debe ser 1 o mayor.';
    }

    if (form.price !== '' && (Number(form.price) < 0 || Number.isNaN(Number(form.price)))) {
      nextErrors.price = 'El precio debe ser 0 o mayor.';
    }

    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!validate()) {
      return;
    }

    const payload: EventPayload = {
      title: form.title.trim(),
      description: form.description.trim() || null,
      priority: Number(form.priority || 1),
      thumbnail: form.thumbnail || null,
      price: form.price === '' ? null : Number(form.price),
      siteUrlId: form.siteUrlId || null,
      referenceUrlId: form.referenceUrlId || null,
      categoryId: form.categoryId,
    };

    try {
      setSaving(true);
      setFormError(null);
      await onSubmit(payload);
      setSaved(true);
    } catch (error) {
      setFormError(getApiErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
      <form className="space-y-5 rounded-lg border border-stone-200 bg-white p-5 shadow-sm" onSubmit={handleSubmit}>
        {catalogError && <ErrorState message={`No se pudieron cargar los catalogos: ${catalogError}`} />}
        {formError && <ErrorState message={formError} />}
        {saved && <SuccessMessage message={successMessage} />}

        <Input
          label="Titulo"
          name="title"
          required
          maxLength={100}
          value={form.title}
          error={fieldErrors.title}
          helperText="Maximo 100 caracteres."
          onChange={(event) => updateField('title', event.target.value)}
        />

        <Textarea
          label="Descripcion"
          name="description"
          value={form.description}
          onChange={(event) => updateField('description', event.target.value)}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Prioridad"
            name="priority"
            type="number"
            min={1}
            required
            value={form.priority}
            error={fieldErrors.priority}
            onChange={(event) => updateField('priority', event.target.value)}
          />
          <Input
            label="Precio"
            name="price"
            type="number"
            min={0}
            step="0.01"
            value={form.price}
            error={fieldErrors.price}
            helperText="Dejalo vacio si el precio no esta publicado."
            onChange={(event) => updateField('price', event.target.value)}
          />
        </div>

        <Select
          label="Tipo de evento"
          name="categoryId"
          required
          value={form.categoryId}
          error={fieldErrors.categoryId}
          onChange={(event) => updateField('categoryId', event.target.value)}
        >
          <option value="">Selecciona un tipo</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </Select>

        <Input
          label="Imagen"
          name="thumbnail"
          value={form.thumbnail}
          helperText="El backend aun no tiene carga de imagenes; usa un UUID existente si aplica."
          onChange={(event) => updateField('thumbnail', event.target.value)}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            label="URL del sitio"
            name="siteUrlId"
            value={form.siteUrlId}
            onChange={(event) => updateField('siteUrlId', event.target.value)}
          >
            <option value="">Sin URL del sitio</option>
            {urls.map((url) => (
              <option key={url.id} value={url.id}>
                {url.description || url.kind || url.url}
              </option>
            ))}
          </Select>
          <Select
            label="URL de referencia"
            name="referenceUrlId"
            value={form.referenceUrlId}
            onChange={(event) => updateField('referenceUrlId', event.target.value)}
          >
            <option value="">Sin URL de referencia</option>
            {urls.map((url) => (
              <option key={url.id} value={url.id}>
                {url.description || url.kind || url.url}
              </option>
            ))}
          </Select>
        </div>

        <div className="flex flex-wrap justify-end gap-3 border-t border-stone-200 pt-5">
          <ButtonLink to="/admin/events" variant="secondary">
            Cancelar
          </ButtonLink>
          <Button type="submit" disabled={saving}>
            {saving ? 'Guardando...' : submitLabel}
          </Button>
        </div>
      </form>

      <aside className="space-y-3">
        <div>
          <p className="text-sm font-bold text-stone-950">Vista previa</p>
          <p className="mt-1 text-sm text-stone-600">Aproximacion de la tarjeta publica del evento.</p>
        </div>
        <EventPreviewCard event={previewEvent} category={selectedCategory} siteUrl={selectedSiteUrl} />
      </aside>
    </div>
  );
}

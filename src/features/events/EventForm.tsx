import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Plus, Trash2 } from 'lucide-react';

import { getEventTypes } from '../../api/eventTypeService';
import { Button, ButtonLink } from '../../components/common/Button';
import { ErrorState, SuccessMessage } from '../../components/common/StatusMessage';
import { Input } from '../../components/common/Input';
import { Textarea } from '../../components/common/Textarea';
import type { CategoryResponse, EventPayload, EventResponse, ScheduleResponse, UrlResponse } from '../../types/event';
import { getApiErrorMessage } from '../../api/httpClient';
import { getImage, uploadImage } from '../../api/mediaService';
import { EventPreviewCard } from './EventPreviewCard';
import { useI18n } from '../../i18n/I18nContext';

type FormState = {
  title: string;
  description: string;
  priority: string;
  thumbnail: string;
  price: string;
  visibleOnWebsite: boolean;
  categoryIds: string[];
};

const emptyForm: FormState = {
  title: '',
  description: '',
  priority: '1',
  thumbnail: '',
  price: '',
  visibleOnWebsite: true,
  categoryIds: [],
};

type EventFormProps = {
  initialEvent?: EventResponse;
  initialSchedules?: ScheduleResponse[];
  initialUrls?: UrlResponse[];
  submitLabel: string;
  successMessage: string;
  manageRelated?: boolean;
  onSubmit: (payload: EventPayload, schedules: EventScheduleValue[], urls: EventUrlValue[]) => Promise<void>;
};

type ScheduleRow = {
  id?: string;
  startDate: string;
  endDate: string;
};

type ScheduleErrors = {
  startDate?: string;
  endDate?: string;
};

export type EventScheduleValue = {
  id?: string;
  startDate: string;
  endDate: string | null;
};

type UrlRow = {
  id?: string;
  url: string;
  description: string;
  kind: string;
};

type UrlErrors = {
  url?: string;
  description?: string;
  kind?: string;
};

export type EventUrlValue = {
  id?: string;
  url: string;
  description: string | null;
  kind: string;
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
    visibleOnWebsite: event.visibleOnWebsite,
    categoryIds: event.categoryIds ?? [],
  };
}

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

function fromSchedules(schedules?: ScheduleResponse[]): ScheduleRow[] {
  if (!schedules?.length) {
    return [{ startDate: '', endDate: '' }];
  }

  return schedules.map((schedule) => ({
    id: schedule.id,
    startDate: toDateTimeLocal(schedule.startDate),
    endDate: toDateTimeLocal(schedule.endDate),
  }));
}

function fromUrls(urls?: UrlResponse[]): UrlRow[] {
  if (!urls?.length) {
    return [{ url: '', description: '', kind: 'official' }];
  }

  return urls.map((url) => ({
    id: url.id,
    url: url.url,
    description: url.description ?? '',
    kind: url.kind ?? '',
  }));
}

export function EventForm({ initialEvent, initialSchedules, initialUrls, submitLabel, successMessage, manageRelated = true, onSubmit }: EventFormProps) {
  const { language, t } = useI18n();
  const [form, setForm] = useState<FormState>(() => fromEvent(initialEvent));
  const [schedules, setSchedules] = useState<ScheduleRow[]>(() => fromSchedules(initialSchedules));
  const [urls, setUrls] = useState<UrlRow[]>(() => fromUrls(initialUrls));
  const [categories, setCategories] = useState<CategoryResponse[]>([]);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [scheduleErrors, setScheduleErrors] = useState<ScheduleErrors[]>([]);
  const [urlErrors, setUrlErrors] = useState<UrlErrors[]>([]);
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm(fromEvent(initialEvent));
  }, [initialEvent]);

  useEffect(() => {
    setSchedules(fromSchedules(initialSchedules));
  }, [initialSchedules]);

  useEffect(() => {
    setUrls(fromUrls(initialUrls));
  }, [initialUrls]);

  useEffect(() => {
    let cancelled = false;
    if (!initialEvent?.thumbnail) {
      setThumbnailUrl(null);
      return;
    }

    getImage(initialEvent.thumbnail)
      .then((image) => {
        if (!cancelled) {
          setThumbnailUrl(image.readUrl);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setImageError(t('No se pudo cargar la imagen seleccionada.'));
        }
      });

    return () => {
      cancelled = true;
    };
  }, [initialEvent?.thumbnail, t]);

  useEffect(() => {
    async function loadCatalogs() {
      try {
        const categoryPage = await getEventTypes();
        setCategories(categoryPage.content);
        setCatalogError(null);
      } catch (error) {
        setCatalogError(getApiErrorMessage(error, language));
      }
    }

    void loadCatalogs();
  }, [language]);

  const selectedCategories = categories.filter((category) => form.categoryIds.includes(category.id));

  const previewEvent = useMemo(
    () => ({
      title: form.title,
      description: form.description || null,
      priority: Number(form.priority || 1),
      thumbnail: form.thumbnail || null,
      price: form.price === '' ? null : Number(form.price),
      categoryIds: form.categoryIds,
      createdAt: initialEvent?.createdAt,
    }),
    [form, initialEvent?.createdAt],
  );

  function updateField(name: Exclude<keyof FormState, 'categoryIds'>, value: string) {
    setForm((current) => ({ ...current, [name]: value }));
    setSaved(false);
    setFieldErrors((current) => ({ ...current, [name]: undefined }));
  }

  function toggleCategory(categoryId: string) {
    setForm((current) => ({
      ...current,
      categoryIds: current.categoryIds.includes(categoryId)
        ? current.categoryIds.filter((id) => id !== categoryId)
        : [...current.categoryIds, categoryId],
    }));
    setFieldErrors((current) => ({ ...current, categoryIds: undefined }));
    setSaved(false);
  }

  function toggleVisibility() {
    setForm((current) => ({ ...current, visibleOnWebsite: !current.visibleOnWebsite }));
    setSaved(false);
  }

  function updateSchedule(index: number, name: keyof Omit<ScheduleRow, 'id'>, value: string) {
    setSchedules((current) =>
      current.map((schedule, currentIndex) => currentIndex === index ? { ...schedule, [name]: value } : schedule),
    );
    setScheduleErrors((current) =>
      current.map((errors, currentIndex) => currentIndex === index ? { ...errors, [name]: undefined } : errors),
    );
    setSaved(false);
  }

  function addSchedule() {
    setSchedules((current) => [...current, { startDate: '', endDate: '' }]);
    setSaved(false);
  }

  function removeSchedule(index: number) {
    setSchedules((current) => {
      const nextSchedules = current.filter((_, currentIndex) => currentIndex !== index);
      return nextSchedules.length ? nextSchedules : [{ startDate: '', endDate: '' }];
    });
    setScheduleErrors((current) => current.filter((_, currentIndex) => currentIndex !== index));
    setSaved(false);
  }

  function updateUrl(index: number, name: keyof Omit<UrlRow, 'id'>, value: string) {
    setUrls((current) =>
      current.map((url, currentIndex) => currentIndex === index ? { ...url, [name]: value } : url),
    );
    setUrlErrors((current) =>
      current.map((errors, currentIndex) => currentIndex === index ? { ...errors, [name]: undefined } : errors),
    );
    setSaved(false);
  }

  function addUrl() {
    setUrls((current) => [...current, { url: '', description: '', kind: 'reference' }]);
    setSaved(false);
  }

  function removeUrl(index: number) {
    setUrls((current) => {
      const nextUrls = current.filter((_, currentIndex) => currentIndex !== index);
      return nextUrls.length ? nextUrls : [{ url: '', description: '', kind: 'official' }];
    });
    setUrlErrors((current) => current.filter((_, currentIndex) => currentIndex !== index));
    setSaved(false);
  }

  async function uploadThumbnail(file: File | undefined) {
    if (!file) {
      return;
    }

    try {
      setUploadingImage(true);
      setImageError(null);
      const image = await uploadImage(file);
      updateField('thumbnail', image.id);
      setThumbnailUrl(image.readUrl);
    } catch (error) {
      setImageError(getApiErrorMessage(error, language));
    } finally {
      setUploadingImage(false);
    }
  }

  function removeThumbnail() {
    updateField('thumbnail', '');
    setThumbnailUrl(null);
    setImageError(null);
  }

  function validate() {
    const nextErrors: Partial<Record<keyof FormState, string>> = {};
    const nextScheduleErrors: ScheduleErrors[] = schedules.map(() => ({}));
    const nextUrlErrors: UrlErrors[] = urls.map(() => ({}));

    if (!form.title.trim()) {
      nextErrors.title = t('El titulo es requerido.');
    } else if (form.title.trim().length > 100) {
      nextErrors.title = t('El titulo debe tener maximo 100 caracteres.');
    }

    if (form.categoryIds.length === 0) {
      nextErrors.categoryIds = t('Selecciona al menos un tipo de evento.');
    }

    if (Number(form.priority) < 1 || Number.isNaN(Number(form.priority))) {
      nextErrors.priority = t('La prioridad debe ser 1 o mayor.');
    }

    if (form.price !== '' && (Number(form.price) < 0 || Number.isNaN(Number(form.price)))) {
      nextErrors.price = t('El precio debe ser 0 o mayor.');
    }

    schedules.forEach((schedule, index) => {
      const isPopulated = Boolean(schedule.id || schedule.startDate || schedule.endDate);
      if (!isPopulated) {
        return;
      }

      if (!schedule.startDate) {
        nextScheduleErrors[index].startDate = t('La fecha de inicio es requerida.');
      } else if (Number.isNaN(new Date(schedule.startDate).getTime())) {
        nextScheduleErrors[index].startDate = t('Ingresa una fecha de inicio valida.');
      }

      if (schedule.endDate && Number.isNaN(new Date(schedule.endDate).getTime())) {
        nextScheduleErrors[index].endDate = t('Ingresa una fecha final valida.');
      } else if (schedule.endDate && schedule.startDate && new Date(schedule.endDate) <= new Date(schedule.startDate)) {
        nextScheduleErrors[index].endDate = t('La fecha final debe ser posterior al inicio.');
      }
    });

    urls.forEach((url, index) => {
      const isPopulated = Boolean(url.id || url.url || url.description || url.kind !== 'official');
      if (!isPopulated) {
        return;
      }

      if (!url.url.trim()) {
        nextUrlErrors[index].url = t('La URL es requerida.');
      } else {
        try {
          new URL(url.url.trim());
        } catch {
          nextUrlErrors[index].url = t('Ingresa una URL valida, incluyendo http:// o https://.');
        }
      }

      if (!url.kind.trim()) {
        nextUrlErrors[index].kind = t('El tipo es requerido.');
      } else if (url.kind.trim().length > 20) {
        nextUrlErrors[index].kind = t('El tipo debe tener maximo 20 caracteres.');
      }

      if (url.description.trim().length > 100) {
        nextUrlErrors[index].description = t('La descripcion debe tener maximo 100 caracteres.');
      }
    });

    setFieldErrors(nextErrors);
    setScheduleErrors(nextScheduleErrors);
    setUrlErrors(nextUrlErrors);
    return (
      Object.keys(nextErrors).length === 0 &&
      nextScheduleErrors.every((errors) => Object.keys(errors).length === 0) &&
      nextUrlErrors.every((errors) => Object.keys(errors).length === 0)
    );
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
      visibleOnWebsite: form.visibleOnWebsite,
      categoryIds: form.categoryIds,
    };
    const schedulePayloads = schedules
      .filter((schedule) => schedule.id || schedule.startDate || schedule.endDate)
      .map((schedule) => ({
        id: schedule.id,
        startDate: new Date(schedule.startDate).toISOString(),
        endDate: schedule.endDate ? new Date(schedule.endDate).toISOString() : null,
      }));
    const urlPayloads = urls
      .filter((url) => url.id || url.url || url.description || url.kind !== 'official')
      .map((url) => ({
        id: url.id,
        url: url.url.trim(),
        description: url.description.trim() || null,
        kind: url.kind.trim(),
      }));

    try {
      setSaving(true);
      setFormError(null);
      await onSubmit(payload, schedulePayloads, urlPayloads);
      setSaved(true);
    } catch (error) {
      setFormError(getApiErrorMessage(error, language));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
      <form className="space-y-5 rounded-lg border border-stone-200 bg-white p-5 shadow-sm" onSubmit={handleSubmit}>
        {catalogError && <ErrorState message={t('No se pudieron cargar los catalogos: {error}', { error: catalogError })} />}
        {formError && <ErrorState message={formError} />}
        {saved && <SuccessMessage message={successMessage} />}

        <Input
          label={t('Titulo')}
          name="title"
          required
          maxLength={100}
          value={form.title}
          error={fieldErrors.title}
          helperText={t('Maximo 100 caracteres.')}
          onChange={(event) => updateField('title', event.target.value)}
        />

        <Textarea
          label={t('Descripcion')}
          name="description"
          value={form.description}
          onChange={(event) => updateField('description', event.target.value)}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label={t('Prioridad')}
            name="priority"
            type="number"
            min={1}
            required
            value={form.priority}
            error={fieldErrors.priority}
            onChange={(event) => updateField('priority', event.target.value)}
          />
          <Input
            label={t('Precio')}
            name="price"
            type="number"
            min={0}
            step="0.01"
            value={form.price}
            error={fieldErrors.price}
            helperText={t('Dejalo vacio si el precio no esta publicado.')}
            onChange={(event) => updateField('price', event.target.value)}
          />
        </div>

        <section className="rounded-md border border-stone-200 bg-stone-50 p-4">
          <label className="flex cursor-pointer items-start gap-3">
            <input
              className="mt-1 h-4 w-4 accent-teal-700"
              type="checkbox"
              checked={form.visibleOnWebsite}
              onChange={toggleVisibility}
            />
            <span>
              <span className="block text-sm font-semibold text-stone-900">{t('Visible en el sitio web')}</span>
              <span className="mt-1 block text-sm text-stone-600">
                {t('Desactiva esta opcion para ocultar el evento del sitio publico sin eliminarlo.')}
              </span>
            </span>
          </label>
        </section>

        <fieldset className="space-y-2">
          <legend className="text-sm font-semibold text-stone-800">
            {t('Tipos de evento')} <span className="text-rose-700">*</span>
          </legend>
          <p className="text-sm text-stone-600">{t('Selecciona al menos una categoria; puedes asignar varias.')}</p>
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <label
                key={category.id}
                className={`cursor-pointer rounded-md border px-3 py-2 text-sm font-medium transition ${
                  form.categoryIds.includes(category.id)
                    ? 'border-teal-600 bg-teal-50 text-teal-900'
                    : 'border-stone-300 bg-white text-stone-700 hover:border-stone-400'
                }`}
              >
                <input
                  className="mr-2 align-middle"
                  type="checkbox"
                  checked={form.categoryIds.includes(category.id)}
                  onChange={() => toggleCategory(category.id)}
                />
                {category.name}
              </label>
            ))}
          </div>
          {fieldErrors.categoryIds && <p className="text-sm text-red-600">{fieldErrors.categoryIds}</p>}
        </fieldset>

        <section className="space-y-3 rounded-md border border-stone-200 bg-stone-50 p-4">
          <p className="text-sm font-semibold text-stone-900">{t('Imagen del evento')}</p>
          <p className="text-sm text-stone-600">{t('Selecciona una imagen JPEG, PNG, WEBP o GIF de hasta 5 MB.')}</p>
          {thumbnailUrl && (
            <img className="h-40 w-full rounded-md object-cover sm:w-64" src={thumbnailUrl} alt={form.title || t('Imagen del evento')} />
          )}
          <div className="flex flex-wrap items-center gap-3">
            <label className="inline-flex h-10 cursor-pointer items-center rounded-md bg-rose-600 px-3.5 text-sm font-semibold text-white hover:bg-rose-700">
              {uploadingImage ? t('Subiendo imagen...') : t('Subir imagen')}
              <input
                className="sr-only"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                disabled={uploadingImage}
                onChange={(event) => void uploadThumbnail(event.target.files?.[0])}
              />
            </label>
            {form.thumbnail && (
              <Button type="button" variant="secondary" onClick={removeThumbnail}>
                {t('Quitar imagen')}
              </Button>
            )}
          </div>
          {imageError && <p className="text-sm text-red-700">{imageError}</p>}
        </section>

        {manageRelated && <section className="space-y-4 rounded-md border border-stone-200 bg-stone-50 p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-stone-900">{t('Horarios / Fechas')}</p>
              <p className="mt-1 text-sm text-stone-600">{t('Agrega todas las fechas en las que este evento estara disponible.')}</p>
            </div>
            <Button type="button" variant="secondary" onClick={addSchedule}>
              <Plus className="h-4 w-4" /> {t('Agregar horario')}
            </Button>
          </div>

          {schedules.map((schedule, index) => (
            <div key={schedule.id ?? index} className="grid items-start gap-3 rounded-md border border-stone-200 bg-white p-3 sm:grid-cols-[1fr_1fr_auto]">
              <Input
                label={`${t('Inicio')} ${index + 1}`}
                name={`schedule-${index}-start`}
                type="datetime-local"
                value={schedule.startDate}
                error={scheduleErrors[index]?.startDate}
                onChange={(event) => updateSchedule(index, 'startDate', event.target.value)}
              />
              <Input
                label={t('Fin')}
                name={`schedule-${index}-end`}
                type="datetime-local"
                value={schedule.endDate}
                error={scheduleErrors[index]?.endDate}
                onChange={(event) => updateSchedule(index, 'endDate', event.target.value)}
              />
              <button
                className="mt-8 rounded-md p-2 text-red-600 hover:bg-red-50"
                type="button"
                title={t('Eliminar horario')}
                onClick={() => removeSchedule(index)}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </section>}

        {manageRelated && <section className="space-y-4 rounded-md border border-stone-200 bg-stone-50 p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-stone-900">{t('Enlaces / URLs')}</p>
              <p className="mt-1 text-sm text-stone-600">{t('Agrega todos los enlaces externos relacionados con este evento.')}</p>
            </div>
            <Button type="button" variant="secondary" onClick={addUrl}>
              <Plus className="h-4 w-4" /> {t('Agregar enlace')}
            </Button>
          </div>

          {urls.map((url, index) => (
            <div key={url.id ?? index} className="space-y-3 rounded-md border border-stone-200 bg-white p-3">
              <div className="grid items-start gap-3 sm:grid-cols-[1fr_160px_auto]">
                <Input
                  label={`URL ${index + 1}`}
                  name={`url-${index}-url`}
                  type="url"
                  value={url.url}
                  error={urlErrors[index]?.url}
                  onChange={(event) => updateUrl(index, 'url', event.target.value)}
                />
                <Input
                  label={t('Tipo')}
                  name={`url-${index}-kind`}
                  maxLength={20}
                  value={url.kind}
                  error={urlErrors[index]?.kind}
                  onChange={(event) => updateUrl(index, 'kind', event.target.value)}
                />
                <button
                  className="mt-8 rounded-md p-2 text-red-600 hover:bg-red-50"
                  type="button"
                  title={t('Eliminar enlace')}
                  onClick={() => removeUrl(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <Input
                label={t('Descripcion')}
                name={`url-${index}-description`}
                maxLength={100}
                value={url.description}
                error={urlErrors[index]?.description}
                onChange={(event) => updateUrl(index, 'description', event.target.value)}
              />
            </div>
          ))}
        </section>}

        <div className="flex flex-wrap justify-end gap-3 border-t border-stone-200 pt-5">
          <ButtonLink to="/admin/events" variant="secondary">
            {t('Cancelar')}
          </ButtonLink>
          <Button type="submit" disabled={saving}>
            {saving ? t('Guardando...') : submitLabel}
          </Button>
        </div>
      </form>

      <aside className="space-y-3">
        <div>
          <p className="text-sm font-bold text-stone-950">{t('Vista previa')}</p>
          <p className="mt-1 text-sm text-stone-600">{t('Aproximacion de la tarjeta publica del evento.')}</p>
        </div>
        {!form.visibleOnWebsite && (
          <p className="rounded-md bg-stone-100 p-3 text-sm font-medium text-stone-700">
            {t('Este evento esta oculto del sitio web. La vista previa solo es para administracion.')}
          </p>
        )}
        <EventPreviewCard event={previewEvent} categories={selectedCategories} thumbnailUrl={thumbnailUrl} primaryUrl={urls.find((url) => url.url.trim())} />
      </aside>
    </div>
  );
}

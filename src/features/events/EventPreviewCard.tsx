import { Calendar, Tag } from 'lucide-react';

import type { CategoryResponse, EventPayload } from '../../types/event';
import { formatCurrency, formatDate, truncate } from '../../utils/formatters';
import { useI18n } from '../../i18n/I18nContext';

type EventPreviewCardProps = {
  event: Partial<EventPayload> & { createdAt?: string };
  categories?: CategoryResponse[];
  primaryUrl?: { url: string };
};

export function EventPreviewCard({ event, categories, primaryUrl }: EventPreviewCardProps) {
  const { language, t } = useI18n();
  return (
    <article className="overflow-hidden rounded-lg border border-stone-200 bg-white shadow-sm">
      <div className="aspect-[16/9] bg-gradient-to-br from-rose-100 via-amber-100 to-teal-100">
        {event.thumbnail ? (
          <div className="flex h-full items-center justify-center p-6 text-center text-sm font-medium text-stone-600">
            {t('Imagen registrada: {id}', { id: event.thumbnail.slice(0, 8) })}
          </div>
        ) : (
          <div className="flex h-full items-center justify-center text-sm font-semibold text-stone-600">
            Kedada
          </div>
        )}
      </div>

      <div className="p-5">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          {categories?.map((category) => (
            <span key={category.id} className="inline-flex items-center gap-1 rounded-md bg-teal-50 px-2.5 py-1 text-xs font-semibold text-teal-800">
              <Tag className="h-3.5 w-3.5" />
              {category.name}
            </span>
          ))}
          {event.priority && event.priority > 1 && (
            <span className="rounded-md bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700">
              {t('Prioridad {value}', { value: event.priority })}
            </span>
          )}
        </div>

        <h2 className="line-clamp-2 text-lg font-bold text-stone-950">
          {event.title || t('Titulo del evento')}
        </h2>
        <p className="mt-3 line-clamp-3 text-sm leading-6 text-stone-600">
          {truncate(event.description, 150, language)}
        </p>

        <div className="mt-5 flex flex-wrap gap-3 text-sm text-stone-700">
          <span className="inline-flex items-center gap-1.5">
            <Calendar className="h-4 w-4 text-stone-400" />
            {t('Publicado {date}', { date: formatDate(event.createdAt ?? new Date().toISOString(), language) })}
          </span>
          <span className="font-semibold text-stone-950">{formatCurrency(event.price, language)}</span>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <span className="inline-flex h-10 items-center justify-center rounded-md bg-stone-950 px-3 text-sm font-semibold text-white">
            {t('Ver detalle')}
          </span>
          {primaryUrl?.url && (
            <span className="inline-flex h-10 items-center justify-center rounded-md border border-stone-300 px-3 text-sm font-semibold text-stone-800">
              {t('Sitio oficial')}
            </span>
          )}
        </div>
      </div>
    </article>
  );
}

import { useEffect, useMemo, useState } from 'react';
import { Activity, ArrowLeft, ArrowRight, Eye, Search, Share2 } from 'lucide-react';
import { useLocation } from 'react-router-dom';

import { getEvents } from '../../api/eventService';
import { getApiErrorMessage } from '../../api/httpClient';
import { getEventMetricDaily, getEventMetricSummary } from '../../api/metricService';
import { EmptyState } from '../../components/common/EmptyState';
import { Button, ButtonLink } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { LoadingState } from '../../components/common/LoadingState';
import { Select } from '../../components/common/Select';
import { ErrorState } from '../../components/common/StatusMessage';
import { useI18n } from '../../i18n/I18nContext';
import type { Language } from '../../i18n/I18nContext';
import type { EventMetricDailyResponse, EventMetricSummaryResponse, EventResponse } from '../../types/event';

const dayOptions = [7, 30, 90];
const pageSize = 15;
type VisibilityFilter = 'all' | 'visible' | 'hidden';
type MetricsViewState = {
  eventId?: string;
  eventSearch?: string;
  visibility?: VisibilityFilter;
  eventPage?: number;
  days?: number;
};

export function MetricsPage() {
  const location = useLocation();
  const { language, t } = useI18n();
  const restoredState = readMetricsViewState(location.state);
  const [events, setEvents] = useState<EventResponse[]>([]);
  const [eventSearch, setEventSearch] = useState(restoredState.eventSearch ?? '');
  const [visibility, setVisibility] = useState<VisibilityFilter>(restoredState.visibility ?? 'all');
  const [eventPage, setEventPage] = useState(restoredState.eventPage ?? 0);
  const [eventId, setEventId] = useState(restoredState.eventId ?? '');
  const [days, setDays] = useState(dayOptions.includes(restoredState.days ?? 0) ? restoredState.days as number : 30);
  const [summary, setSummary] = useState<EventMetricSummaryResponse | null>(null);
  const [daily, setDaily] = useState<EventMetricDailyResponse[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [metricsLoading, setMetricsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadEvents() {
      try {
        setEventsLoading(true);
        const firstPage = await getEvents({ page: 0, size: 100, sort: 'title,asc' });
        const remainingPages = await Promise.all(
          Array.from({ length: firstPage.totalPages - 1 }, (_, index) =>
            getEvents({ page: index + 1, size: 100, sort: 'title,asc' }).then((page) => page.content),
          ),
        );
        const loadedEvents = [firstPage.content, ...remainingPages].flat();
        setEvents(loadedEvents);
        setEventId((current) => loadedEvents.some((event) => event.id === current) ? current : preferredEvent(loadedEvents)?.id ?? '');
        setError(null);
      } catch (loadError) {
        setError(getApiErrorMessage(loadError, language));
      } finally {
        setEventsLoading(false);
      }
    }

    void loadEvents();
  }, [language]);

  useEffect(() => {
    if (!eventId) {
      setSummary(null);
      setDaily([]);
      return;
    }

    let active = true;

    async function loadMetrics() {
      const to = new Date();
      const from = new Date(to);
      from.setUTCDate(from.getUTCDate() - days + 1);

      try {
        setMetricsLoading(true);
        setError(null);
        const [loadedSummary, loadedDaily] = await Promise.all([
          getEventMetricSummary(eventId),
          getEventMetricDaily(eventId, isoDay(from), isoDay(to)),
        ]);
        if (active) {
          setSummary(loadedSummary);
          setDaily(loadedDaily);
          setError(null);
        }
      } catch (loadError) {
        if (active) {
          setError(getApiErrorMessage(loadError, language));
        }
      } finally {
        if (active) {
          setMetricsLoading(false);
        }
      }
    }

    void loadMetrics();

    return () => {
      active = false;
    };
  }, [days, eventId, language]);

  const selectedEvent = events.find((event) => event.id === eventId);
  const filteredEvents = useMemo(() => {
    const query = eventSearch.toLocaleLowerCase().trim();
    return events
      .filter((event) => {
        const hasQuery = !query || `${event.title} ${event.description ?? ''}`.toLocaleLowerCase().includes(query);
        const hasVisibility = visibility === 'all'
          || (visibility === 'visible' ? event.visibleOnWebsite : !event.visibleOnWebsite);
        return hasQuery && hasVisibility;
      })
      .sort((left, right) => Number(right.visibleOnWebsite) - Number(left.visibleOnWebsite)
        || left.title.localeCompare(right.title, language === 'es' ? 'es' : 'en'));
  }, [eventSearch, events, language, visibility]);
  const eventTotalPages = Math.max(Math.ceil(filteredEvents.length / pageSize), 1);
  const pagedEvents = filteredEvents.slice(eventPage * pageSize, (eventPage + 1) * pageSize);
  const series = useMemo(() => buildSeries(daily, days), [daily, days]);
  const periodTotals = useMemo(() => daily.reduce(
    (total, metric) => ({ views: total.views + metric.views, shares: total.shares + metric.shares }),
    { views: 0, shares: 0 },
  ), [daily]);
  const metricsViewState: MetricsViewState = { eventId, eventSearch, visibility, eventPage, days };

  useEffect(() => {
    if (filteredEvents.length > 0 && !filteredEvents.some((event) => event.id === eventId)) {
      setEventId(filteredEvents[0].id);
    }
  }, [eventId, filteredEvents]);

  useEffect(() => {
    if (eventPage >= eventTotalPages) {
      setEventPage(eventTotalPages - 1);
    }
  }, [eventPage, eventTotalPages]);

  if (eventsLoading) {
    return <LoadingState label={t('Cargando metricas...')} />;
  }

  if (error && events.length === 0) {
    return <ErrorState message={error} />;
  }

  if (events.length === 0) {
    return <EmptyState title={t('No hay eventos para analizar')} description={t('Crea un evento para comenzar a medir interacciones.')} />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black text-stone-950">{t('Metricas de eventos')}</h2>
        <p className="mt-1 text-sm text-stone-600">{t('Busca un evento y visualiza su traccion en el tiempo.')}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[330px_minmax(0,1fr)]">
        <aside className="h-fit rounded-lg border border-stone-200 bg-white p-4 shadow-sm">
          <h3 className="text-sm font-bold uppercase tracking-wide text-stone-500">{t('Seleccionar evento')}</h3>
          <div className="relative mt-4">
            <Input
              className="pl-9"
              label={t('Buscar evento')}
              name="eventSearch"
              placeholder={t('Titulo o descripcion')}
              value={eventSearch}
              onChange={(event) => {
                setEventSearch(event.target.value);
                setEventPage(0);
              }}
            />
            <Search className="pointer-events-none absolute bottom-3.5 left-3 h-4 w-4 text-stone-400" />
          </div>
          <div className="mt-4">
            <Select
              label={t('Visibilidad')}
              name="visibility"
              value={visibility}
              onChange={(event) => {
                setVisibility(event.target.value as VisibilityFilter);
                setEventPage(0);
              }}
            >
              <option value="all">{t('Todos')}</option>
              <option value="visible">{t('Solo visibles')}</option>
              <option value="hidden">{t('Solo no publicados')}</option>
            </Select>
          </div>

          <p className="mt-5 text-xs font-semibold text-stone-500">{t('{count} eventos', { count: filteredEvents.length })}</p>
          <div className="mt-3 space-y-2">
            {filteredEvents.length === 0 ? (
              <p className="rounded-md bg-stone-50 p-4 text-sm text-stone-600">{t('No hay eventos que coincidan con tu busqueda.')}</p>
            ) : pagedEvents.map((event) => (
              <button
                key={event.id}
                className={`w-full rounded-md border p-3 text-left transition ${
                  event.id === eventId
                    ? 'border-rose-200 bg-rose-50'
                    : 'border-stone-200 bg-white hover:border-stone-300 hover:bg-stone-50'
                }`}
                type="button"
                onClick={() => setEventId(event.id)}
              >
                <span className="block text-sm font-semibold text-stone-950">{event.title}</span>
                <span className={`mt-2 inline-flex rounded px-2 py-0.5 text-xs font-semibold ${
                  event.visibleOnWebsite ? 'bg-teal-50 text-teal-800' : 'bg-stone-100 text-stone-600'
                }`}>
                  {event.visibleOnWebsite ? t('Publicado') : t('No publicado')}
                </span>
              </button>
            ))}
          </div>
          {filteredEvents.length > pageSize && (
            <div className="mt-4 flex items-center justify-between border-t border-stone-100 pt-4">
              <Button
                aria-label={t('Anterior')}
                className="px-2.5"
                type="button"
                variant="secondary"
                disabled={eventPage === 0}
                onClick={() => setEventPage((current) => current - 1)}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <span className="text-xs font-semibold text-stone-600">
                {t('Pagina')} {eventPage + 1} {t('de')} {eventTotalPages}
              </span>
              <Button
                aria-label={t('Siguiente')}
                className="px-2.5"
                type="button"
                variant="secondary"
                disabled={eventPage + 1 >= eventTotalPages}
                onClick={() => setEventPage((current) => current + 1)}
              >
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </aside>

        <main className="min-w-0 space-y-5">
          <section className="flex flex-col gap-4 rounded-lg border border-stone-200 bg-white p-5 shadow-sm sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-wide text-rose-600">{t('Evento seleccionado')}</p>
              <h3 className="mt-1 text-xl font-black text-stone-950">{selectedEvent?.title}</h3>
              {selectedEvent && (
                <ButtonLink
                  className="mt-4"
                  variant="secondary"
                  to={`/admin/events/${selectedEvent.id}`}
                  state={{ source: 'metrics', metricsState: metricsViewState }}
                >
                  <Eye className="h-4 w-4" /> {t('Ver detalle del evento')}
                </ButtonLink>
              )}
            </div>
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-stone-500">{t('Periodo')}</p>
              <div className="flex rounded-md border border-stone-200 bg-stone-50 p-1">
                {dayOptions.map((option) => (
                  <button
                    key={option}
                    className={`rounded px-3 py-2 text-sm font-semibold transition ${
                      days === option ? 'bg-white text-rose-700 shadow-sm' : 'text-stone-600 hover:text-stone-950'
                    }`}
                    type="button"
                    onClick={() => setDays(option)}
                  >
                    {t('{days} dias', { days: option })}
                  </button>
                ))}
              </div>
            </div>
          </section>

          {error && <ErrorState message={error} />}
          {metricsLoading ? (
            <LoadingState label={t('Cargando metricas...')} />
          ) : (
            <>
              <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <MetricCard icon={Eye} label={t('Vistas del periodo')} value={periodTotals.views} />
                <MetricCard icon={Share2} label={t('Compartidos del periodo')} value={periodTotals.shares} />
                <MetricCard icon={Activity} label={t('Vistas historicas')} value={summary?.views ?? 0} />
                <MetricCard icon={Activity} label={t('Compartidos historicos')} value={summary?.shares ?? 0} />
              </section>

              <MetricTrendChart
                data={series}
                language={language}
                title={t('Traccion diaria')}
                description={t('Compara las vistas y los compartidos durante el periodo seleccionado.')}
                viewsLabel={t('Vistas')}
                sharesLabel={t('Compartidos')}
              />

              <section className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
                <h3 className="text-lg font-bold text-stone-950">{t('Dias con actividad')}</h3>
                {daily.length === 0 ? (
                  <p className="mt-4 rounded-md bg-stone-50 p-5 text-sm text-stone-600">{t('Aun no hay interacciones en este periodo.')}</p>
                ) : (
                  <div className="mt-4 overflow-x-auto">
                    <table className="min-w-full divide-y divide-stone-200 text-sm">
                      <thead className="text-left text-xs font-bold uppercase tracking-wide text-stone-500">
                        <tr>
                          <th className="pb-3 pr-5">{t('Dia')}</th>
                          <th className="pb-3 pr-5">{t('Vistas')}</th>
                          <th className="pb-3">{t('Compartidos')}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100">
                        {[...daily].reverse().map((metric) => (
                          <tr key={metric.day}>
                            <td className="py-3 pr-5 font-medium text-stone-900">{formatDay(metric.day, language)}</td>
                            <td className="py-3 pr-5 text-stone-700">{metric.views}</td>
                            <td className="py-3 text-stone-700">{metric.shares}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            </>
          )}
        </main>
      </div>
    </div>
  );
}

function preferredEvent(events: EventResponse[]) {
  return [...events].sort((left, right) => Number(right.visibleOnWebsite) - Number(left.visibleOnWebsite)
    || left.title.localeCompare(right.title))[0];
}

function readMetricsViewState(state: unknown): MetricsViewState {
  if (!state || typeof state !== 'object') {
    return {};
  }
  const value = state as Record<string, unknown>;
  const visibility = value.visibility === 'visible' || value.visibility === 'hidden' || value.visibility === 'all'
    ? value.visibility
    : undefined;
  return {
    eventId: typeof value.eventId === 'string' ? value.eventId : undefined,
    eventSearch: typeof value.eventSearch === 'string' ? value.eventSearch : undefined,
    visibility,
    eventPage: typeof value.eventPage === 'number' && value.eventPage >= 0 ? value.eventPage : undefined,
    days: typeof value.days === 'number' ? value.days : undefined,
  };
}

function MetricCard({ icon: Icon, label, value }: { icon: typeof Activity; label: string; value: number }) {
  return (
    <div className="rounded-lg border border-stone-200 bg-white p-4 shadow-sm">
      <Icon className="h-5 w-5 text-rose-600" />
      <p className="mt-3 text-sm font-semibold text-stone-500">{label}</p>
      <p className="mt-1 text-3xl font-black text-stone-950">{value.toLocaleString()}</p>
    </div>
  );
}

function MetricTrendChart({
  data,
  language,
  title,
  description,
  viewsLabel,
  sharesLabel,
}: {
  data: EventMetricDailyResponse[];
  language: Language;
  title: string;
  description: string;
  viewsLabel: string;
  sharesLabel: string;
}) {
  const width = 760;
  const height = 278;
  const left = 40;
  const top = 18;
  const bottom = 46;
  const chartHeight = height - top - bottom;
  const chartWidth = width - left - 18;
  const maximum = Math.max(...data.flatMap((metric) => [metric.views, metric.shares]), 1);
  const viewsPoints = chartPoints(data, (metric) => metric.views, maximum, chartWidth, chartHeight, left, top);
  const sharesPoints = chartPoints(data, (metric) => metric.shares, maximum, chartWidth, chartHeight, left, top);
  const tickStep = Math.max(Math.ceil(data.length / 5), 1);

  return (
    <section className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col justify-between gap-3 sm:flex-row">
        <div>
          <h3 className="text-lg font-bold text-stone-950">{title}</h3>
          <p className="mt-1 text-sm text-stone-600">{description}</p>
        </div>
        <div className="flex gap-4 text-sm font-semibold text-stone-600">
          <ChartKey color="bg-rose-500" label={viewsLabel} />
          <ChartKey color="bg-teal-500" label={sharesLabel} />
        </div>
      </div>

      <div className="mt-5 overflow-x-auto">
        <svg className="h-auto min-w-[560px] w-full" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={title}>
          {[0, 0.5, 1].map((factor) => {
            const y = top + chartHeight * factor;
            const value = Math.round(maximum * (1 - factor));
            return (
              <g key={factor}>
                <line x1={left} x2={width - 18} y1={y} y2={y} stroke="#e7e5e4" strokeDasharray="4 4" />
                <text x={left - 8} y={y + 4} textAnchor="end" className="fill-stone-400 text-[11px]">{value}</text>
              </g>
            );
          })}
          <polyline fill="none" points={viewsPoints} stroke="#f43f5e" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />
          <polyline fill="none" points={sharesPoints} stroke="#14b8a6" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />
          {data.map((metric, index) => {
            if (index !== 0 && index !== data.length - 1 && index % tickStep !== 0) {
              return null;
            }
            const x = xPosition(index, data.length, chartWidth, left);
            return (
              <g key={metric.day}>
                <text x={x} y={height - 16} textAnchor="middle" className="fill-stone-500 text-[11px]">
                  {formatShortDay(metric.day, language)}
                </text>
                <title>{`${formatDay(metric.day, language)}: ${viewsLabel} ${metric.views}, ${sharesLabel} ${metric.shares}`}</title>
              </g>
            );
          })}
        </svg>
      </div>
    </section>
  );
}

function ChartKey({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className={`h-2.5 w-2.5 rounded-full ${color}`} />
      {label}
    </span>
  );
}

function buildSeries(daily: EventMetricDailyResponse[], days: number) {
  const metricsByDay = new Map(daily.map((metric) => [metric.day, metric]));
  const today = new Date();
  return Array.from({ length: days }, (_, index) => {
    const date = new Date(today);
    date.setUTCDate(today.getUTCDate() - days + index + 1);
    const day = isoDay(date);
    return metricsByDay.get(day) ?? { eventId: '', day, views: 0, shares: 0, ownerId: null };
  });
}

function chartPoints(
  data: EventMetricDailyResponse[],
  value: (metric: EventMetricDailyResponse) => number,
  maximum: number,
  width: number,
  height: number,
  left: number,
  top: number,
) {
  return data.map((metric, index) => {
    const x = xPosition(index, data.length, width, left);
    const y = top + height - (value(metric) / maximum) * height;
    return `${x},${y}`;
  }).join(' ');
}

function xPosition(index: number, length: number, width: number, left: number) {
  return left + (length === 1 ? 0 : (index / (length - 1)) * width);
}

function isoDay(value: Date) {
  return value.toISOString().slice(0, 10);
}

function formatDay(value: string, language: Language) {
  return new Intl.DateTimeFormat(language === 'es' ? 'es-SV' : 'en-US', { dateStyle: 'medium', timeZone: 'UTC' }).format(new Date(`${value}T00:00:00Z`));
}

function formatShortDay(value: string, language: Language) {
  return new Intl.DateTimeFormat(language === 'es' ? 'es-SV' : 'en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' }).format(new Date(`${value}T00:00:00Z`));
}

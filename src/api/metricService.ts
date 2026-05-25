import { apiClient } from './httpClient';
import type { EventMetricDailyResponse, EventMetricSummaryResponse } from '../types/event';
import type { UUID } from '../types/api';

export async function getEventMetricSummary(eventId: UUID) {
  const response = await apiClient.get<EventMetricSummaryResponse>(`/api/v1/events/${eventId}/metrics/summary`);
  return response.data;
}

export async function getEventMetricDaily(eventId: UUID, from: string, to: string) {
  const response = await apiClient.get<EventMetricDailyResponse[]>(`/api/v1/events/${eventId}/metrics/daily`, {
    params: { from, to },
  });
  return response.data;
}

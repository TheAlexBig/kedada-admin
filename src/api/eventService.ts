import { apiClient, compactParams } from './httpClient';
import type { PageResponse, UUID } from '../types/api';
import type { EventPayload, EventResponse, EventSearchParams, EventUpdatePayload } from '../types/event';

export async function getEvents(params: EventSearchParams = {}) {
  const response = await apiClient.get<PageResponse<EventResponse>>('/api/v1/events', {
    params: compactParams(params),
  });

  return response.data;
}

export async function getEventById(id: UUID) {
  const response = await apiClient.get<EventResponse>(`/api/v1/events/${id}`);
  return response.data;
}

export async function createEvent(payload: EventPayload) {
  const response = await apiClient.post<EventResponse>('/api/v1/events', payload);
  return response.data;
}

export async function updateEvent(id: UUID, payload: EventUpdatePayload) {
  const response = await apiClient.put<EventResponse>(`/api/v1/events/${id}`, payload);
  return response.data;
}

export async function deleteEvent(id: UUID) {
  await apiClient.delete(`/api/v1/events/${id}`);
}

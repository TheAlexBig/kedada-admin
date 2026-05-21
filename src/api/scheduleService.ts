import { apiClient } from './httpClient';
import type { ListParams, PageResponse, UUID } from '../types/api';
import type { SchedulePayload, ScheduleResponse } from '../types/event';

export async function getSchedules(params: ListParams = { page: 0, size: 100, sort: 'startDate,asc' }) {
  const response = await apiClient.get<PageResponse<ScheduleResponse>>('/api/v1/schedules', {
    params,
  });

  return response.data;
}

export async function getScheduleById(id: UUID) {
  const response = await apiClient.get<ScheduleResponse>(`/api/v1/schedules/${id}`);
  return response.data;
}

export async function getSchedulesForEvent(eventId: UUID, params: ListParams = { page: 0, size: 100, sort: 'startDate,asc' }) {
  const page = await getSchedules(params);

  return {
    ...page,
    content: page.content.filter((schedule) => schedule.eventId === eventId),
  };
}

export async function createSchedule(payload: SchedulePayload) {
  const response = await apiClient.post<ScheduleResponse>('/api/v1/schedules', payload);
  return response.data;
}

export async function updateSchedule(id: UUID, payload: SchedulePayload) {
  const response = await apiClient.put<ScheduleResponse>(`/api/v1/schedules/${id}`, payload);
  return response.data;
}

export async function deleteSchedule(id: UUID) {
  await apiClient.delete(`/api/v1/schedules/${id}`);
}

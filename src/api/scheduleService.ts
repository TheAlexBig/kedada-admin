import { apiClient } from './httpClient';
import type { ListParams, PageResponse, UUID } from '../types/api';
import type { SchedulePayload, ScheduleResponse } from '../types/event';

type ScheduleListParams = ListParams & {
  eventId?: UUID;
};

export async function getSchedules(params: ScheduleListParams = { page: 0, size: 100, sort: 'startDate,asc' }) {
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
  const firstPage = await getSchedules({ ...params, eventId, page: 0 });
  const remainingPages = await Promise.all(
    Array.from({ length: Math.max(firstPage.totalPages - 1, 0) }, (_, index) =>
      getSchedules({ ...params, eventId, page: index + 1 }),
    ),
  );
  const content = [firstPage, ...remainingPages].flatMap((page) => page.content);

  return {
    ...firstPage,
    content,
    totalElements: content.length,
    totalPages: content.length === 0 ? 0 : 1,
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

import { apiClient } from './httpClient';
import type { ListParams, PageResponse, UUID } from '../types/api';
import type { CategoryPayload, CategoryResponse } from '../types/event';

export async function getEventTypes(params: ListParams = { page: 0, size: 100, sort: 'name,asc' }) {
  const response = await apiClient.get<PageResponse<CategoryResponse>>('/api/v1/categories', {
    params,
  });

  return response.data;
}

export async function getEventTypeById(id: UUID) {
  const response = await apiClient.get<CategoryResponse>(`/api/v1/categories/${id}`);
  return response.data;
}

export async function createEventType(payload: CategoryPayload) {
  const response = await apiClient.post<CategoryResponse>('/api/v1/categories', payload);
  return response.data;
}

export async function updateEventType(id: UUID, payload: CategoryPayload) {
  const response = await apiClient.put<CategoryResponse>(`/api/v1/categories/${id}`, payload);
  return response.data;
}

export async function deleteEventType(id: UUID) {
  await apiClient.delete(`/api/v1/categories/${id}`);
}

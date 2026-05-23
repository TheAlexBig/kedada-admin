import { apiClient } from './httpClient';
import type { ListParams, PageResponse, UUID } from '../types/api';
import type { UrlPayload, UrlResponse } from '../types/event';

export async function getUrls(params: ListParams = { page: 0, size: 100, sort: 'kind,asc' }) {
  const response = await apiClient.get<PageResponse<UrlResponse>>('/api/v1/urls', {
    params,
  });

  return response.data;
}

export async function getUrlById(id: UUID) {
  const response = await apiClient.get<UrlResponse>(`/api/v1/urls/${id}`);
  return response.data;
}

export async function createUrl(payload: UrlPayload) {
  const response = await apiClient.post<UrlResponse>('/api/v1/urls', payload);
  return response.data;
}

export async function updateUrl(id: UUID, payload: UrlPayload) {
  const response = await apiClient.put<UrlResponse>(`/api/v1/urls/${id}`, payload);
  return response.data;
}

export async function deleteUrl(id: UUID) {
  await apiClient.delete(`/api/v1/urls/${id}`);
}

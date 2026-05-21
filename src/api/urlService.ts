import { apiClient } from './httpClient';
import type { ListParams, PageResponse, UUID } from '../types/api';
import type { UrlResponse } from '../types/event';

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

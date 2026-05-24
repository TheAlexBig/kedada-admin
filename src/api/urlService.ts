import { apiClient } from './httpClient';
import type { ListParams, PageResponse, UUID } from '../types/api';
import type { UrlPayload, UrlResponse } from '../types/event';

type UrlListParams = ListParams & {
  eventId?: UUID;
};

export async function getUrls(params: UrlListParams = { page: 0, size: 100, sort: 'kind,asc' }) {
  const response = await apiClient.get<PageResponse<UrlResponse>>('/api/v1/urls', {
    params,
  });

  return response.data;
}

export async function getUrlById(id: UUID) {
  const response = await apiClient.get<UrlResponse>(`/api/v1/urls/${id}`);
  return response.data;
}

export async function getUrlsForEvent(eventId: UUID, params: ListParams = { page: 0, size: 100, sort: 'kind,asc' }) {
  const firstPage = await getUrls({ ...params, eventId, page: 0 });
  const remainingPages = await Promise.all(
    Array.from({ length: Math.max(firstPage.totalPages - 1, 0) }, (_, index) =>
      getUrls({ ...params, eventId, page: index + 1 }),
    ),
  );
  const content = [firstPage, ...remainingPages].flatMap((page) => page.content);

  return { ...firstPage, content, totalElements: content.length, totalPages: content.length === 0 ? 0 : 1 };
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

import { apiClient } from './httpClient';
import type { UUID } from '../types/api';
import type { MediaAssetResponse } from '../types/event';

export async function uploadImage(file: File) {
  const formData = new FormData();
  formData.append('file', file);
  const response = await apiClient.post<MediaAssetResponse>('/api/v1/media', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
}

export async function getImage(id: UUID) {
  const response = await apiClient.get<MediaAssetResponse>(`/api/v1/media/${id}`);
  return response.data;
}

import type { UUID } from './api';

export interface EventResponse {
  id: UUID;
  title: string;
  description: string | null;
  priority: number | null;
  thumbnail: UUID | null;
  price: number | null;
  visibleOnWebsite: boolean;
  categoryIds: UUID[];
  ownerId: UUID | null;
  createdAt: string;
  updatedAt: string;
}

export interface EventPayload {
  title: string;
  description?: string | null;
  priority?: number | null;
  thumbnail?: UUID | null;
  price?: number | null;
  visibleOnWebsite?: boolean;
  categoryIds: UUID[];
}

export type EventUpdatePayload = Partial<EventPayload>;

export interface EventSearchParams {
  q?: string;
  categoryId?: UUID;
  minPrice?: number;
  maxPrice?: number;
  priority?: number;
  fromDate?: string;
  toDate?: string;
  page?: number;
  size?: number;
  sort?: string;
}

export interface ScheduleResponse {
  id: UUID;
  eventId: UUID | null;
  startDate: string;
  endDate: string | null;
  ownerId: UUID | null;
}

export interface SchedulePayload {
  eventId?: UUID | null;
  startDate: string;
  endDate?: string | null;
}

export interface CategoryResponse {
  id: UUID;
  name: string;
  ownerId: UUID | null;
  type: string[];
}

export interface CategoryPayload {
  name: string;
  type?: string[];
}

export interface UrlResponse {
  id: UUID;
  eventId: UUID | null;
  url: string;
  description: string | null;
  ownerId: UUID | null;
  kind: string | null;
}

export interface UrlPayload {
  eventId?: UUID | null;
  url: string;
  description?: string | null;
  kind: string;
}

export interface MediaAssetResponse {
  id: UUID;
  originalFilename: string;
  contentType: string;
  sizeBytes: number;
  readUrl: string;
  readUrlExpiresAt: string;
  createdAt: string;
}

export interface EnrichedEvent extends EventResponse {
  categories?: CategoryResponse[];
  urls?: UrlResponse[];
}

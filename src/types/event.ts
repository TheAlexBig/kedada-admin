import type { UUID } from './api';

export interface EventResponse {
  id: UUID;
  title: string;
  description: string | null;
  priority: number | null;
  thumbnail: UUID | null;
  price: number | null;
  siteUrlId: UUID | null;
  referenceUrlId: UUID | null;
  categoryId: UUID;
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
  siteUrlId?: UUID | null;
  referenceUrlId?: UUID | null;
  categoryId: UUID;
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
  url: string;
  description: string | null;
  ownerId: UUID | null;
  kind: string | null;
}

export interface EnrichedEvent extends EventResponse {
  category?: CategoryResponse;
  siteUrl?: UrlResponse;
  referenceUrl?: UrlResponse;
}

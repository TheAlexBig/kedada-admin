import type { UUID } from './api';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

export interface AuthResponse {
  tokenType: string;
  accessToken: string;
  userId: UUID;
  email: string;
  name: string;
}

export interface AuthSession {
  tokenType: string;
  accessToken: string;
  userId: UUID;
  email: string;
  name: string;
}

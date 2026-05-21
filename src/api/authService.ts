import { apiClient } from './httpClient';
import type { AuthResponse, LoginRequest, RegisterRequest } from '../types/auth';

export async function login(payload: LoginRequest) {
  const response = await apiClient.post<AuthResponse>('/api/v1/auth/login', payload);
  return response.data;
}

export async function register(payload: RegisterRequest) {
  const response = await apiClient.post<AuthResponse>('/api/v1/auth/register', payload);
  return response.data;
}

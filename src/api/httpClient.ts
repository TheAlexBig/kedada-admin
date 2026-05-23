import axios, { AxiosError } from 'axios';

import { getStoredSession } from '../auth/sessionStorage';
import type { ApiErrorBody } from '../types/api';

const baseURL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080';

export const apiClient = axios.create({
  baseURL,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const token = getStoredSession()?.accessToken;

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export function compactParams(params: object) {
  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== ''),
  );
}

export function getApiErrorMessage(error: unknown): string {
  if (axios.isAxiosError<ApiErrorBody>(error)) {
    const axiosError = error as AxiosError<ApiErrorBody>;
    const data = axiosError.response?.data;
    const fieldMessage = data?.fieldErrors?.[0]?.message;
    const status = axiosError.response?.status;

    return (
      fieldMessage ??
      data?.message ??
      data?.error ??
      (status === 403 ? 'No tienes permisos para completar esta accion. Revisa que hayas iniciado sesion y que el recurso pertenezca a tu usuario.' : undefined) ??
      (status === 401 ? 'Tu sesion expiro o no es valida. Inicia sesion nuevamente.' : undefined) ??
      axiosError.message ??
      'No pudimos completar la solicitud.'
    );
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'No pudimos completar la solicitud.';
}

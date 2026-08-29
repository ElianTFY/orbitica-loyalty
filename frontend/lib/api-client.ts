import { getCsrfToken, isMutating } from './security';

export class ApiError extends Error {
  code: string;
  status: number;
  details?: any;

  constructor(message: string, status: number, code = 'API_ERROR', details?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export async function apiClient<T>(path: string, init?: RequestInit): Promise<T> {
  const method = (init?.method || 'GET').toUpperCase();
  const headers = new Headers(init?.headers || {});

  if (init?.body && !headers.has('Content-Type') && typeof init.body === 'string') {
    headers.set('Content-Type', 'application/json');
  }

  if (isMutating(method)) {
    const csrf = getCsrfToken();
    if (csrf) headers.set('X-CSRF-Token', csrf);
  }

  const response = await fetch('/api/backend' + path, {
    ...init,
    method,
    headers,
    cache: 'no-store',
  });

  if (response.status === 204) {
    return {} as T;
  }

  let data: any = null;
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    data = await response.json().catch(() => null);
  }

  if (!response.ok) {
    const message = data?.detail || data?.error?.message || response.statusText || 'Ocurrió un error inesperado.';
    const code = data?.error?.code || 'HTTP_' + response.status;
    throw new ApiError(message, response.status, code, data?.error?.details);
  }

  return data as T;
}

export async function apiFetchRaw(path: string, init?: RequestInit): Promise<Response> {
  const method = (init?.method || 'GET').toUpperCase();
  const headers = new Headers(init?.headers || {});
  if (isMutating(method)) {
    const csrf = getCsrfToken();
    if (csrf) headers.set('X-CSRF-Token', csrf);
  }

  return fetch('/api/backend' + path, {
    ...init,
    method,
    headers,
    cache: 'no-store',
  });
}

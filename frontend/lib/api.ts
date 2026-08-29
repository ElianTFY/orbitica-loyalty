export { apiClient, apiFetchRaw as apiFetch, ApiError } from './api-client';

export async function readError(response: Response, fallback = 'Ocurrió un error.') {
  try {
    const data = await response.json();
    return data.detail || data.error?.message || fallback;
  } catch {
    return fallback;
  }
}

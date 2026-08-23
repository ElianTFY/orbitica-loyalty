import { getCsrfToken, isMutating } from "@/lib/security";

export async function apiFetch(path: string, init?: RequestInit) {
  const method = (init?.method || "GET").toUpperCase();
  const headers = new Headers(init?.headers || {});
  if (init?.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  if (isMutating(method)) {
    const csrf = getCsrfToken();
    if (csrf) headers.set("X-CSRF-Token", csrf);
  }

  return fetch(`/api/backend${path}`, {
    ...init,
    method,
    headers,
    cache: "no-store",
  });
}

export async function readError(response: Response, fallback = "Ocurrió un error.") {
  try {
    const data = await response.json();
    return data.detail || fallback;
  } catch {
    return fallback;
  }
}

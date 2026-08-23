export function getCsrfToken() {
  if (typeof document === "undefined") return "";
  const match = document.cookie.match(/(?:^|; )orbitica_csrf=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : "";
}

export function isMutating(method?: string) {
  const value = (method || "GET").toUpperCase();
  return !["GET", "HEAD", "OPTIONS"].includes(value);
}

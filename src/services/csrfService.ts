// CSRF cookie name is hardcoded on the backend; keep in sync if it ever changes.
export const CSRF_COOKIE_NAME = 'csrfToken';
export const CSRF_HEADER_NAME = 'X-CSRF-Token';

// Read the CSRF cookie on every call — the backend rotates it on /auth/refresh,
// so caching the value at boot would replay a stale token after refresh.
export const getCsrfToken = (): string | null => {
  if (typeof document === 'undefined') return null;

  const prefix = `${CSRF_COOKIE_NAME}=`;
  for (const part of document.cookie.split(';')) {
    const trimmed = part.trim();
    if (trimmed.startsWith(prefix)) {
      return decodeURIComponent(trimmed.slice(prefix.length));
    }
  }
  return null;
};

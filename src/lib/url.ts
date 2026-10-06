const HTTP_SCHEME = /^https?:\/\//i;
// Cualquier esquema tipo "foo:" (javascript:, data:, vbscript:, ...).
const ANY_SCHEME = /^[a-z][a-z0-9+.-]*:/i;

/** Fuerza HTTPS y descarta esquemas peligrosos (javascript:, data:) para usar en href/src. */
export function normalizeUrl(url?: string | null): string | undefined {
  if (!url) return undefined;
  const trimmed = url.trim();
  if (!trimmed) return undefined;
  if (HTTP_SCHEME.test(trimmed)) {
    return trimmed.replace(/^http:\/\//i, "https://");
  }
  if (trimmed.startsWith("//")) return `https:${trimmed}`;
  if (ANY_SCHEME.test(trimmed)) return undefined;
  return `https://${trimmed}`;
}

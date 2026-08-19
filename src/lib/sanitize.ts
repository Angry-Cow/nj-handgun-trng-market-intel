// Helpers for safely embedding database values into raw HTML strings and URLs.
//
// Rows in this app are writable through the public data API, so any text that
// came out of the database must be treated as untrusted when it is used outside
// of JSX (Leaflet popups, printable windows) or as a URL attribute.

/** Escape a value for interpolation into an HTML string or attribute. */
export function escapeHtml(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const ALLOWED_URL_SCHEMES = ["http:", "https:", "mailto:", "tel:"];

/**
 * Return the URL only if it uses a safe scheme, otherwise undefined.
 * Blocks javascript:, data: and vbscript: URLs that would otherwise execute
 * when a user clicks a link built from stored data.
 */
export function safeUrl(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const raw = value.trim();
  if (!raw) return undefined;

  // Reject control characters used to smuggle a scheme past a naive check.
  if (/[\u0000-\u001F\u007F]/.test(raw)) return undefined;

  // Scheme-relative and absolute-path URLs are safe and have no scheme to parse.
  if (raw.startsWith("/") || raw.startsWith("#")) return raw;

  try {
    const parsed = new URL(raw, window.location.origin);
    return ALLOWED_URL_SCHEMES.includes(parsed.protocol) ? raw : undefined;
  } catch {
    return undefined;
  }
}

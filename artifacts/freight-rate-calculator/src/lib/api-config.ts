import { setBaseUrl } from '@workspace/api-client-react';

// VITE_API_URL is an origin (no /api suffix). Generated routes include /api.
const configuredUrl = import.meta.env.VITE_API_URL?.trim();
export const apiOrigin = configuredUrl ? normalizeApiOrigin(configuredUrl) : '';

export function normalizeApiOrigin(value: string): string {
  const url = new URL(value);
  if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password ||
      url.pathname !== '/' || url.search || url.hash) {
    throw new Error('VITE_API_URL must be an HTTP(S) origin without credentials, a path, query, or fragment.');
  }
  return url.origin;
}

// Keep generated requests relative when the setting is absent.
setBaseUrl(apiOrigin || null);

export function apiPath(path: string): string {
  // Preserve the existing upload path in preview.
  const prefix = apiOrigin || import.meta.env.BASE_URL.replace(/\/$/, '');
  return `${prefix}${path}`;
}

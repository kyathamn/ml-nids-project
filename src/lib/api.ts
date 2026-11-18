/**
 * Robust API Client with safe JSON parsing and fallback capabilities.
 * Prevents "Unexpected token '<', '<!doctype' ... is not valid JSON" errors
 * caused by server cold starts, 502/504 proxy issues, or Vite index.html fallbacks.
 */

export async function safeFetchJson<T>(url: string, options?: RequestInit): Promise<T | null> {
  try {
    const res = await fetch(url, options);
    if (!res.ok) {
      return null;
    }
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      // Received HTML (e.g. <!doctype html> from Vite SPA fallback or error page)
      return null;
    }
    const data = await res.json();
    return data as T;
  } catch {
    return null;
  }
}

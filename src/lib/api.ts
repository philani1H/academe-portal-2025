export const API_BASE: string = (import.meta.env as { VITE_API_URL?: string }).VITE_API_URL || '';

export function withBase(path: string): string {
  if (!path) return API_BASE || '';
  if (/^https?:\/\//i.test(path)) return path;
  return `${API_BASE}${path}`;
}

export async function apiFetch<T = any>(path: string, init?: RequestInit): Promise<T> {
  const url = withBase(path);
  const response = await fetch(url, {
    ...(init || {}),
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
  } as RequestInit);

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`Request failed (${response.status}): ${text || response.statusText}`);
  }

  // Some endpoints return wrapped { success, data }, others return raw JSON
  const json = await response.json().catch(() => null);
  return (json && (json.data !== undefined ? json.data : json)) as T;
}


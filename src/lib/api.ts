export const API_BASE: string = '/api';

export function withBase(path: string): string {
  if (!path) return API_BASE || '';
  if (/^https?:\/\//i.test(path)) return path;
  return `${API_BASE}${path}`;
}

function getAuthToken(): string | null {
  try {
    return localStorage.getItem('auth_token');
  } catch {
    return null;
  }
}

export async function apiFetch<T = any>(path: string, init?: RequestInit & { timeoutMs?: number }): Promise<T> {
  const url = withBase(path);
  const controller = new AbortController();
  const timeoutMs = init?.timeoutMs ?? 20000;
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const token = getAuthToken();
    const response = await fetch(url, {
      ...(init || {}),
      credentials: 'include',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(init?.headers || {}),
      },
    } as RequestInit);

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      throw new Error(`Request failed (${response.status}): ${text || response.statusText}`);
    }

    const json = await response.json().catch(() => null);
    
    if (json === null) {
      console.warn(`API returned null for ${path}`);
      return (Array.isArray(init?.body) ? [] : null) as T;
    }

    const data = json.data !== undefined ? json.data : json;
    
    if (Array.isArray(data)) {
      return data.filter(item => item !== null) as T;
    }
    
    return data as T;
  } catch (error) {
    console.error(`API fetch error for ${path}:`, error);
    return (Array.isArray(init?.body) ? [] : null) as T;
  } finally {
    clearTimeout(timer);
  }
}


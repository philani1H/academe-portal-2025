export const API_BASE: string = '/api';

export function withBase(path: string): string {
  if (!path) return API_BASE || '';
  if (/^https?:\/\//i.test(path)) return path;
  return `${API_BASE}${path}`;
}

export async function apiFetch<T = any>(path: string, init?: RequestInit): Promise<T> {
  const url = withBase(path);
  
  try {
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

    const json = await response.json().catch(() => null);
    
    // Handle null responses
    if (json === null) {
      console.warn(`API returned null for ${path}`);
      // Return empty array for array types, null for others
      return (Array.isArray(init?.body) ? [] : null) as T;
    }

    // Handle wrapped responses
    const data = json.data !== undefined ? json.data : json;
    
    // Ensure arrays are initialized
    if (Array.isArray(data)) {
      return data.filter(item => item !== null) as T;
    }
    
    return data as T;
  } catch (error) {
    console.error(`API fetch error for ${path}:`, error);
    // Return empty array for array types, null for others
    return (Array.isArray(init?.body) ? [] : null) as T;
  }
}


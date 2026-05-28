/**
 * Module-level reactive store for server-pushed public content.
 * The server emits a `public-content` event on every new socket connection
 * (and after any admin content change), so even first-time visitors receive
 * all public data before their first HTTP request completes.
 *
 * Usage in components:
 *   const [items, setItems] = useState<T[]>(() =>
 *     (getPublicContent('subjects') as T[]) ?? readContentCache<T[]>('subjects') ?? defaults
 *   );
 *   useEffect(() => subscribePublicContent('subjects', () => {
 *     const d = getPublicContent('subjects'); if (d) setItems(d as T[]);
 *   }), []);
 */

import { socket } from '@/lib/socket';
import { writeContentCache } from '@/lib/contentCache';

// Keys must match what the server sends in the PublicContentPayload
export type PublicContentKey = 'subjects' | 'tutors' | 'testimonials' | 'pricing' | 'siteSettings';

const store: Partial<Record<PublicContentKey, any[]>> = {};
const listeners: Map<PublicContentKey, Set<() => void>> = new Map();

function notify(key: PublicContentKey) {
  listeners.get(key)?.forEach(fn => fn());
}

/** Read the latest server-pushed data for a content type. Returns null if not yet received. */
export function getPublicContent(key: PublicContentKey): any[] | null {
  return store[key] ?? null;
}

/** Subscribe to updates for a content type. Returns an unsubscribe function. */
export function subscribePublicContent(key: PublicContentKey, fn: () => void): () => void {
  if (!listeners.has(key)) listeners.set(key, new Set());
  listeners.get(key)!.add(fn);
  return () => listeners.get(key)?.delete(fn);
}

// Map server payload keys → cache/store keys
const keyMap: Record<string, PublicContentKey> = {
  subjects: 'subjects',
  tutors: 'tutors',
  testimonials: 'testimonials',
  pricing: 'pricing',
  siteSettings: 'siteSettings',
  'site-settings': 'siteSettings',
};

/** Call once (in App.tsx) to wire up the socket listener. */
export function initPublicContentSync() {
  socket.on('public-content', (payload: Record<string, any>) => {
    if (!payload || typeof payload !== 'object') return;
    Object.entries(payload).forEach(([rawKey, val]) => {
      const key = keyMap[rawKey];
      if (!key) return;
      if (Array.isArray(val) && val.length > 0) {
        store[key] = val;
        // Persist to localStorage so the cache layer also benefits
        const cacheKey = rawKey === 'siteSettings' ? 'site-settings' : rawKey;
        writeContentCache(cacheKey, val);
        notify(key);
      }
    });
  });
}

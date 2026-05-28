// Lightweight localStorage cache for public content (subjects, tutors, testimonials, pricing)
// Returning visitors see content instantly; first visits fall back to bundled defaults.

const TTL = 5 * 60 * 1000; // 5 minutes

export function readContentCache<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(`cc_${key}`);
    if (!raw) return null;
    const { data, ts } = JSON.parse(raw);
    if (Date.now() - ts > TTL) return null;
    return data as T;
  } catch {
    return null;
  }
}

export function writeContentCache(key: string, data: unknown): void {
  try {
    localStorage.setItem(`cc_${key}`, JSON.stringify({ data, ts: Date.now() }));
  } catch {}
}

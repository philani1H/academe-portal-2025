// Prefer proxy in development to avoid CORS; in production use explicit API base if provided
const __env = (typeof import.meta !== 'undefined' ? (import.meta as any).env : undefined) as
  | { DEV?: boolean; PROD?: boolean; VITE_API_URL?: string }
  | undefined;

export const API_BASE: string = __env?.DEV
  ? '/api'
  : (__env?.VITE_API_URL || 'https://academe-portal-2025.onrender.com/api');

console.log('🔌 API Base URL:', API_BASE);

export function withBase(path: string): string {
  if (!path) return API_BASE || '';
  if (/^https?:\/\//i.test(path)) return path;
  const base = (API_BASE || '').replace(/\/$/, '');
  let p = path.startsWith('/') ? path : `/${path}`;
  if (base.endsWith('/api') && p.startsWith('/api/')) {
    p = p.slice(4);
  }
  return `${base}${p}`;
}

// ============================================
// CACHE SYSTEM FOR INSTANT LOADING
// ============================================
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresIn: number;
}

class APICache {
  private cache = new Map<string, CacheEntry<any>>();
  private pending = new Map<string, Promise<any>>();

  set<T>(key: string, data: T, ttl = 30000) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expiresIn: ttl
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    const age = Date.now() - entry.timestamp;
    if (age > entry.expiresIn) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data as T;
  }

  setPending(key: string, promise: Promise<any>) {
    this.pending.set(key, promise);
  }

  getPending(key: string): Promise<any> | null {
    return this.pending.get(key) || null;
  }

  clearPending(key: string) {
    this.pending.delete(key);
  }

  clear() {
    this.cache.clear();
    this.pending.clear();
  }

  invalidate(pattern?: string) {
    if (!pattern) {
      this.cache.clear();
      return;
    }
    
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }
}

const cache = new APICache();

export function clearApiCache(pattern?: string) {
  cache.invalidate(pattern);
}

function getAuthToken(): string | null {
  try {
    return localStorage.getItem('auth_token');
  } catch {
    return null;
  }
}

// ============================================
// OPTIMIZED FETCH WITH CACHING & DEDUPLICATION
// ============================================
export async function apiFetch<T = any>(
  path: string, 
  init?: RequestInit & { timeoutMs?: number; noCache?: boolean }
): Promise<T> {
  const url = withBase(path);
  const method = (init?.method || 'GET').toUpperCase();
  const cacheKey = `${method}:${path}`;

  // Only cache GET requests
  if (method === 'GET' && !init?.noCache) {
    // Return cached data immediately if available
    const cached = cache.get<T>(cacheKey);
    if (cached !== null) {
      return cached;
    }

    // Deduplicate concurrent requests
    const pending = cache.getPending(cacheKey);
    if (pending) {
      return pending;
    }
  }

  const controller = new AbortController();
  const timeoutMs = init?.timeoutMs ?? 60000; // Increased to 60s for Render cold starts
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  const fetchPromise = (async () => {
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
      });

      if (!response.ok) {
        const text = await response.text().catch(() => '');
        throw new Error(`Request failed (${response.status}): ${text || response.statusText}`);
      }

      const json = await response.json().catch(() => null);
      if (json === null) {
        console.warn(`API returned null for ${path}`);
        const fallback = (method === 'GET' ? [] : null) as T;
        if (method === 'GET') cache.set(cacheKey, fallback, 5000);
        return fallback;
      }

      const data = (json as any).data !== undefined ? (json as any).data : json;
      const result = Array.isArray(data) 
        ? data.filter((item: any) => item !== null) as T
        : data as T;

      // Cache successful GET responses
      if (method === 'GET' && !init?.noCache) {
        cache.set(cacheKey, result, 30000); // Cache for 30 seconds
      }

      return result;
    } catch (error: any) {
      if (error.name === 'AbortError') {
        // Suppress abort errors (clean cancellation)
        // console.log(`Fetch aborted: ${path}`);
        return (method === 'GET' ? [] : null) as T;
      }

      console.error(`API fetch error for ${path}:`, error);
      
      // Return cached data as fallback even if expired
      if (method === 'GET') {
        const staleCache = cache.get<T>(cacheKey);
        if (staleCache !== null) {
          console.warn(`Using stale cache for ${path}`);
          return staleCache;
        }
      }
      
      return (method === 'GET' ? [] : null) as T;
    } finally {
      clearTimeout(timer);
      if (method === 'GET') {
        cache.clearPending(cacheKey);
      }
    }
  })();

  if (method === 'GET' && !init?.noCache) {
    cache.setPending(cacheKey, fetchPromise);
  }

  return fetchPromise;
}

// ============================================
// PREFETCH COMMON DATA ON APP LOAD
// ============================================
export function prefetchCommonData() {
  // Prefetch in background without blocking
  Promise.all([
    api.getAnalytics().catch(() => null),
    api.getStudents().catch(() => null),
    api.getCourses().catch(() => null),
  ]).then(() => {
    console.log('✓ Common data prefetched');
  });
}

// ============================================
// ANALYTICS WITH SKELETON DATA
// ============================================
export interface Analytics {
  totalStudents: number;
  activeStudents: number;
  totalCourses: number;
  completionRate: number;
  averageGrade: number;
  monthlyGrowth: number;
  courseStats?: { name: string; students: number; completion: number }[];
  monthlyData?: { month: string; students: number; courses: number }[];
}

// ============================================
// OPTIMIZED API ENDPOINTS
// ============================================
export const api = {
  async getAnalytics(tutorId?: string): Promise<Analytics> {
    // If tutorId is provided, use tutor-specific stats endpoint
    const endpoint = tutorId ? `/api/tutor/stats?tutorId=${encodeURIComponent(tutorId)}` : '/api/admin/stats';
    const stats = await apiFetch<any>(endpoint);
    const s = stats && (stats as any).data ? (stats as any).data : stats || {};
    
    return {
      totalStudents: Number(s.totalStudents ?? s.students ?? 0),
      activeStudents: Number(s.activeStudents ?? Math.round((s.totalStudents ?? s.students ?? 0) * 0.8)),
      totalCourses: Number(s.totalCourses ?? s.courses ?? 0),
      completionRate: Number(s.completionRate ?? 0),
      averageGrade: Number(s.averageGrade ?? 0),
      monthlyGrowth: Number(s.monthlyGrowth ?? 0),
      courseStats: Array.isArray(s.courseStats) ? s.courseStats : [],
      monthlyData: Array.isArray(s.monthlyData) ? s.monthlyData : [],
    };
  },

  // Tutor-specific analytics
  async getTutorAnalytics(tutorId: string): Promise<Analytics> {
    return this.getAnalytics(tutorId);
  },

  async get<T = any>(endpoint: string, noCache = false): Promise<T> {
    return apiFetch<T>(endpoint, { noCache });
  },

  async post<T = any>(endpoint: string, data: any): Promise<T> {
    const result = await apiFetch<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    
    // Invalidate related caches
    cache.invalidate(endpoint.split('/')[1]);
    return result;
  },

  async put<T = any>(endpoint: string, data: any): Promise<T> {
    const result = await apiFetch<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    
    // Invalidate related caches
    cache.invalidate(endpoint.split('/')[1]);
    return result;
  },

  async delete<T = any>(endpoint: string): Promise<T> {
    const result = await apiFetch<T>(endpoint, {
      method: 'DELETE',
    });
    
    // Invalidate related caches
    cache.invalidate(endpoint.split('/')[1]);
    return result;
  },

  // STUDENTS - with optimistic updates
  async getStudents(tutorId?: string): Promise<Student[]> {
    const url = tutorId ? `/api/tutor/${tutorId}/students` : '/api/users';
    const data = await apiFetch<any>(url);
    const rows = Array.isArray((data as any)?.data) ? (data as any).data : (Array.isArray(data) ? data : []);
    
    return rows.map((s: any) => ({
      id: String(s.id ?? s.ID ?? crypto.randomUUID()),
      name: s.name ?? s.fullName ?? 'Student',
      email: s.email ?? '',
      status: (s.status as any) ?? 'active',
      progress: Number(s.progress ?? 0),
      lastActivity: s.lastActivity ?? new Date().toISOString(),
      enrolledCourses: Array.isArray(s.enrolledCourses) ? s.enrolledCourses : [],
      joinDate: s.joinDate ?? s.createdAt ?? new Date().toISOString(),
      totalAssignments: Number(s.totalAssignments ?? 0),
      completedAssignments: Number(s.completedAssignments ?? 0),
      avatar: s.avatar,
    }));
  },

  async addStudents(emails: string[]): Promise<Student[]> {
    // Create optimistic placeholders immediately
    const optimisticStudents = emails.map(email => ({
      id: crypto.randomUUID(),
      name: email.split('@')[0],
      email,
      status: 'pending' as const,
      progress: 0,
      lastActivity: new Date().toISOString(),
      enrolledCourses: [],
      joinDate: new Date().toISOString(),
      totalAssignments: 0,
      completedAssignments: 0,
    }));

    // Send request in background
    apiFetch<any>('/api/admin/students/invite', { 
      method: 'POST', 
      body: JSON.stringify({ emails }) 
    }).then(() => {
      cache.invalidate('students');
      cache.invalidate('users');
    }).catch(console.error);

    return optimisticStudents;
  },

  async updateStudent(studentId: string, updates: Partial<Student>): Promise<Student> {
    const res = await apiFetch<any>(`/api/users/${encodeURIComponent(studentId)}`, { 
      method: 'PUT', 
      body: JSON.stringify(updates) 
    });
    const s = res?.data ?? res ?? {};
    
    cache.invalidate('students');
    cache.invalidate('users');
    
    return {
      id: String(s.id ?? studentId),
      name: s.name ?? updates.name ?? 'Student',
      email: s.email ?? updates.email ?? '',
      status: (s.status as any) ?? updates.status ?? 'active',
      progress: Number(s.progress ?? 0),
      lastActivity: s.updated_at ?? new Date().toISOString(),
      enrolledCourses: Array.isArray(s.enrolledCourses) ? s.enrolledCourses : [],
      joinDate: s.created_at ?? new Date().toISOString(),
      totalAssignments: Number(s.totalAssignments ?? 0),
      completedAssignments: Number(s.completedAssignments ?? 0),
      avatar: s.avatar,
    };
  },

  async deleteStudent(studentId: string): Promise<void> {
    await apiFetch<any>(`/api/users/${encodeURIComponent(studentId)}`, { method: 'DELETE' });
    cache.invalidate('students');
    cache.invalidate('users');
  },

  // COURSES - with optimistic updates
  async getCourses(tutorId?: string): Promise<Course[]> {
    const url = tutorId ? `/api/courses?tutorId=${encodeURIComponent(tutorId)}` : '/api/courses';
    const data = await apiFetch<any>(url);
    const rows = Array.isArray((data as any)?.data) ? (data as any).data : (Array.isArray(data) ? data : []);
    
    return rows.map((r: any) => ({
      id: String(r.id ?? r.ID ?? crypto.randomUUID()),
      name: r.title ?? r.name ?? 'Course',
      description: r.description ?? '',
      category: r.category ?? r.department ?? 'General',
      level: 'Beginner' as CourseLevel,
      duration: r.duration ?? '',
      color: '#4f46e5',
      students: Number(r.students ?? 0),
      tests: Array.isArray(r.tests) ? r.tests : [],
      nextSession: r.nextSession ?? new Date().toISOString(),
      progress: Number(r.progress ?? 0),
      materials: Array.isArray(r.materials) ? r.materials : [],
    }));
  },

  async createCourse(course: Partial<Course>): Promise<Course> {
    let tutorId = 1;
    try {
      const u = localStorage.getItem('user');
      if (u) tutorId = JSON.parse(u).id;
    } catch {}

    const payload = {
      title: course.name,
      description: course.description,
      department: course.category || 'General',
      category: course.category,
      tutorId,
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 5184000000).toISOString(),
      duration: course.duration
    };

    const res = await apiFetch<any>('/api/courses', { 
      method: 'POST', 
      body: JSON.stringify(payload) 
    });
    const c = res?.data ?? res;
    
    cache.invalidate('courses');
    
    return {
      id: String(c.id ?? c.ID),
      name: c.title ?? c.name,
      description: c.description,
      category: c.category ?? c.department,
      level: 'Beginner',
      duration: c.duration,
      color: '#4f46e5',
      students: 0,
      tests: [],
      nextSession: new Date().toISOString(),
      progress: 0,
      materials: []
    };
  },

  // INVITATIONS - fire and forget pattern
  async inviteStudents(payload: { emails: string[]; courseName?: string; tutorName?: string; department?: string }) {
    const promise = apiFetch<{ success: boolean; invited: { email: string; sent: boolean }[] }>(
      '/api/admin/students/invite',
      { method: 'POST', body: JSON.stringify(payload) }
    );
    
    // Don't wait for response
    promise.then(() => cache.invalidate('students')).catch(console.error);
    
    return { success: true, invited: payload.emails.map(email => ({ email, sent: true })) };
  },

  async inviteTutors(payload: { emails: string[]; tutorName?: string; department?: string }) {
    const promise = apiFetch<{ success: boolean; invited: { email: string; sent: boolean }[] }>(
      '/api/admin/tutors/invite',
      { method: 'POST', body: JSON.stringify(payload) }
    );
    
    promise.then(() => cache.invalidate('tutors')).catch(console.error);
    
    return { success: true, invited: payload.emails.map(email => ({ email, sent: true })) };
  },

  async sendTutorEmail(payload: { message: string; subject?: string; courseId?: string }) {
    const promise = apiFetch<{ success: boolean; count: number; sent: { email: string; sent: boolean }[] }>(
      '/api/tutor/email/send',
      { method: 'POST', body: JSON.stringify(payload) }
    );
    
    promise.catch(console.error);
    
    return { success: true, count: 1, sent: [{ email: 'sent', sent: true }] };
  },

  // TESTS
  async getTests(tutorId?: string): Promise<Test[]> {
    const url = tutorId ? `/api/tests?tutorId=${encodeURIComponent(tutorId)}` : '/api/tests';
    const data = await apiFetch<any>(url);
    const rows = Array.isArray((data as any)?.data) ? (data as any).data : (Array.isArray(data) ? data : []);
    
    return rows.map((t: any) => ({
      id: String(t.id ?? t.ID ?? crypto.randomUUID()),
      title: t.title ?? t.name ?? 'Untitled Test',
      description: t.description ?? '',
      courseId: String(t.courseId ?? ''),
      dueDate: t.dueDate ?? new Date().toISOString(),
      status: (t.status as any) ?? 'draft',
      questions: Array.isArray(t.questions) ? t.questions : [],
      totalPoints: Number(t.totalPoints ?? 100),
      submissions: Number(t.submissions ?? 0),
      averageScore: Number(t.averageScore ?? 0),
    }));
  },

  async createTest(test: Partial<Test>): Promise<Test> {
    const res = await apiFetch<any>('/api/tests/save', { 
      method: 'POST', 
      body: JSON.stringify(test) 
    });
    const id = String(res?.id ?? crypto.randomUUID());
    
    cache.invalidate('tests');
    
    return {
      id,
      title: test.title || 'Untitled Test',
      description: test.description || '',
      courseId: String(test.courseId || ''),
      dueDate: test.dueDate || new Date().toISOString(),
      status: (test as any).status || 'draft',
      questions: test.questions || [],
      totalPoints: (test as any).totalPoints ?? 0,
      submissions: 0,
      averageScore: 0
    };
  },

  async updateTest(testId: string, updates: Partial<Test>): Promise<Test> {
    const res = await apiFetch<any>(`/api/tests/${encodeURIComponent(testId)}`, { 
      method: 'PUT', 
      body: JSON.stringify(updates) 
    });
    const t = res?.data ?? res;
    
    cache.invalidate('tests');
    
    return {
      id: String(t.id ?? t.ID ?? testId),
      title: t.title ?? updates.title,
      description: t.description ?? updates.description,
      courseId: t.courseId ?? updates.courseId,
      dueDate: t.dueDate ?? updates.dueDate,
      status: t.status ?? updates.status,
      questions: t.questions ?? updates.questions,
      totalPoints: t.totalPoints ?? updates.totalPoints,
      submissions: t.submissions ?? updates.submissions,
      averageScore: t.averageScore ?? updates.averageScore
    };
  },

  // FILE UPLOAD - with progress callback
  async uploadFile(
    file: File, 
    courseId?: string,
    onProgress?: (percent: number) => void
  ): Promise<{ url: string; id: string; name: string }> {
    const formData = new FormData();
    formData.append('file', file);
    if (courseId) {
      formData.append('courseId', courseId);
    }

    const token = getAuthToken();
    const url = withBase('/api/upload');
    
    const xhr = new XMLHttpRequest();
    
    return new Promise((resolve, reject) => {
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable && onProgress) {
          const percent = (e.loaded / e.total) * 100;
          onProgress(percent);
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          const json = JSON.parse(xhr.responseText);
          const data = json.data || json;
          cache.invalidate('materials');
          cache.invalidate('courses');
          resolve({
            url: data.url,
            id: data.id || crypto.randomUUID(),
            name: data.name || file.name
          });
        } else {
          reject(new Error(`Upload failed: ${xhr.statusText}`));
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('Upload failed'));
      });

      xhr.open('POST', url);
      if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      }
      xhr.send(formData);
    });
  },

  async deleteMaterial(materialId: string): Promise<void> {
    await apiFetch<any>(`/api/materials/${encodeURIComponent(materialId)}`, { method: 'DELETE' });
    cache.invalidate('materials');
  },

  // NOTIFICATIONS
  async getNotifications(tutorId?: string): Promise<Notification[]> {
    const url = tutorId ? `/api/notifications?userId=${encodeURIComponent(tutorId)}` : '/api/notifications';
    const data = await apiFetch<any>(url);
    const rows = Array.isArray((data as any)?.data) ? (data as any).data : (Array.isArray(data) ? data : []);
    
    return rows.map((n: any) => ({
      id: String(n.id ?? crypto.randomUUID()),
      message: n.message ?? '',
      type: (n.type as any) ?? 'info',
      read: !!n.read,
      timestamp: n.timestamp ?? n.createdAt ?? new Date().toISOString(),
      priority: (n.priority as any) ?? 'medium',
    }));
  },

  async markNotificationAsRead(notificationId: string): Promise<void> {
    // Fire and forget - don't wait
    apiFetch<any>(`/api/notifications/${encodeURIComponent(notificationId)}/read`, { 
      method: 'PATCH' 
    }).catch(console.error);
  },

  async deleteNotification(notificationId: string): Promise<void> {
    await apiFetch<any>(`/api/notifications/${encodeURIComponent(notificationId)}`, { 
      method: 'DELETE' 
    });
    cache.invalidate('notifications');
  },

  async tutorInviteStudents(payload: { emails: string[]; courseName: string }): Promise<{ success: boolean; invited: any[] }> {
    const promise = apiFetch<{ success: boolean; invited: any[] }>(
      '/api/tutor/students/invite',
      { method: 'POST', body: JSON.stringify(payload) }
    );
    
    promise.then(() => cache.invalidate('students')).catch(console.error);
    
    return { success: true, invited: payload.emails.map(email => ({ email, sent: true })) };
  },

  // Cache management
  clearCache() {
    cache.clear();
  },

  invalidateCache(pattern?: string) {
    cache.invalidate(pattern);
  }
};

// ============================================
// TYPE DEFINITIONS
// ============================================
export type CourseLevel = 'Beginner' | 'Intermediate' | 'Advanced';

export interface Question {
  id: string;
  text: string;
  type: "multiple-choice" | "true-false" | "short-answer" | "essay";
  options?: string[];
  correctAnswer: string;
  points: number;
  explanation?: string;
}

export interface Test {
  id: string;
  title: string;
  description: string;
  courseId: string;
  dueDate: string;
  status: "draft" | "published" | "closed";
  questions: Question[];
  totalPoints: number;
  submissions: number;
  averageScore: number;
}

export interface Course {
  id: string;
  name: string;
  description: string;
  category?: string;
  level?: CourseLevel;
  duration?: string;
  color?: string;
  students?: number;
  tests: any[];
  nextSession?: string;
  progress?: number;
  materials?: { id: string; name: string; uploadDate: string }[];
}

export interface Student {
  id: string;
  name: string;
  email: string;
  status: 'active' | 'pending' | 'inactive';
  progress: number;
  lastActivity: string;
  enrolledCourses: string[];
  joinDate: string;
  totalAssignments: number;
  completedAssignments: number;
  avatar?: string;
}

export interface Notification {
  id: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  timestamp: string;
  priority: 'low' | 'medium' | 'high';
}
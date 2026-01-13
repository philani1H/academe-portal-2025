// Prefer proxy in development to avoid CORS; in production use explicit API base if provided
const __env = (typeof import.meta !== 'undefined' ? (import.meta as any).env : undefined) as
  | { DEV?: boolean; PROD?: boolean; VITE_API_URL?: string }
  | undefined;

export const API_BASE: string = __env?.DEV
  ? '/api'
  : (__env?.VITE_API_URL || '/api');

export function withBase(path: string): string {
  if (!path) return API_BASE || '';
  if (/^https?:\/\//i.test(path)) return path; // already absolute
  const base = (API_BASE || '').replace(/\/$/, '');
  // Normalize leading slash on path
  let p = path.startsWith('/') ? path : `/${path}`;
  // If base already includes '/api' and path also starts with '/api', remove the duplicate '/api'
  if (base.endsWith('/api') && p.startsWith('/api/')) {
    p = p.slice(4);
  }
  return `${base}${p}`;
}

function getAuthToken(): string | null {
  try {
    return localStorage.getItem('auth_token');
  } catch {
    return null;
  }
}

export async function apiFetch<T = any>(
  path: string, 
  init?: RequestInit & { timeoutMs?: number }
): Promise<T> {
  const url = withBase(path);
  const retries = 2;
  const method = (init?.method || 'GET').toString().toUpperCase();

  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timeoutMs = init?.timeoutMs ?? 60000;
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
      });

      if (!response.ok) {
        const text = await response.text().catch(() => '');
        throw new Error(`Request failed (${response.status}): ${text || response.statusText}`);
      }

      const json = await response.json().catch(() => null);
      if (json === null) {
        console.warn(`API returned null for ${path}`);
        return (method === 'GET' ? ([] as any) : (null as any)) as T;
      }

      const data = (json as any).data !== undefined ? (json as any).data : json;
      if (Array.isArray(data)) {
        return data.filter((item: any) => item !== null) as T;
      }
      return data as T;
    } catch (error: any) {
      const isAbort = error?.name === 'AbortError';
      const isNetwork = error?.message?.includes('fetch') || error?.message?.includes('network');
      const canRetry = method === 'GET' && (isAbort || isNetwork) && attempt < retries;
      if (canRetry) {
        const backoff = 1000 * Math.pow(2, attempt); // 1s, 2s
        console.warn(`Retrying ${method} ${path} in ${backoff}ms (attempt ${attempt + 1}/${retries}) due to ${error?.name || 'error'}`);
        await new Promise((r) => setTimeout(r, backoff));
        continue;
      }
      console.error(`API fetch error for ${path}:`, error);
      return (method === 'GET' ? ([] as any) : (null as any)) as T;
    } finally {
      clearTimeout(timer);
    }
  }
  // Fallback (should not reach here)
  return (method === 'GET' ? ([] as any) : (null as any)) as T;
}

// Analytics interface for tutor dashboard
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

// API endpoints
export const api = {
  async getAnalytics(): Promise<Analytics> {
    const stats = await apiFetch<any>('/api/admin/stats');
    const s = stats && (stats as any).data ? (stats as any).data : stats || {};
    
    return {
      totalStudents: Number(s.students ?? 0),
      activeStudents: Number(s.activeStudents ?? Math.round((s.students ?? 0) * 0.8)),
      totalCourses: Number(s.courses ?? 0),
      completionRate: Number(s.completionRate ?? 0),
      averageGrade: Number(s.averageGrade ?? 0),
      monthlyGrowth: Number(s.monthlyGrowth ?? 0),
      courseStats: Array.isArray(s.courseStats) ? s.courseStats : [],
      monthlyData: Array.isArray(s.monthlyData) ? s.monthlyData : [],
    };
  },

  // Common CRUD operations
  async get<T = any>(endpoint: string): Promise<T> {
    return apiFetch<T>(endpoint);
  },

  async post<T = any>(endpoint: string, data: any): Promise<T> {
    return apiFetch<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async put<T = any>(endpoint: string, data: any): Promise<T> {
    return apiFetch<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async delete<T = any>(endpoint: string): Promise<T> {
    return apiFetch<T>(endpoint, {
      method: 'DELETE',
    });
  },
  // Tutor/student management APIs
  async getStudents(): Promise<Student[]> {
    const data = await apiFetch<any>('/api/users'); // fallback if implemented; otherwise map via query
    // If /api/users (list) not available, try to query a few by other endpoints; for now, coerce arrays safely
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
    // Use admin invite endpoint so emails are sent
    const res = await apiFetch<any>('/api/admin/students/invite', { method: 'POST', body: JSON.stringify({ emails }) });
    // Return lightweight placeholders for UI; actual details will populate on next load if backend stores them
    const invited = Array.isArray(res?.invited) ? res.invited : [];
    return invited.map((x: any) => ({
      id: crypto.randomUUID(),
      name: (x.email || '').split('@')[0],
      email: x.email,
      status: 'pending',
      progress: 0,
      lastActivity: new Date().toISOString(),
      enrolledCourses: [],
      joinDate: new Date().toISOString(),
      totalAssignments: 0,
      completedAssignments: 0,
      avatar: undefined,
    }));
  },

  async updateStudent(studentId: string, updates: Partial<Student>): Promise<Student> {
    const res = await apiFetch<any>(`/api/users/${encodeURIComponent(studentId)}`, { method: 'PUT', body: JSON.stringify(updates) });
    const s = res?.data ?? res ?? {};
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
  },

  async getCourses(): Promise<Course[]> {
    const data = await apiFetch<any>('/api/courses');
    const rows = Array.isArray((data as any)?.data) ? (data as any).data : (Array.isArray(data) ? data : []);
    return rows.map((r: any) => ({
      id: String(r.id ?? r.ID ?? crypto.randomUUID()),
      name: r.title ?? r.name ?? 'Course',
      description: r.description ?? '',
      category: r.category ?? r.department ?? 'General',
      level: 'Beginner',
      duration: r.duration ?? '',
      color: '#4f46e5',
      students: Number(r.students ?? 0),
      tests: [],
      nextSession: r.nextSession ?? new Date().toISOString(),
      progress: Number(r.progress ?? 0),
      materials: [],
    }));
  },
  
  // Admin helpers
  async inviteStudents(payload: { emails: string[]; courseName?: string; tutorName?: string; department?: string }) {
    return apiFetch<{ success: boolean; invited: { email: string; sent: boolean }[] }>(
      '/api/admin/students/invite',
      { method: 'POST', body: JSON.stringify(payload) }
    );
  },

  async inviteTutors(payload: { emails: string[]; tutorName?: string; department?: string }) {
    return apiFetch<{ success: boolean; invited: { email: string; sent: boolean }[] }>(
      '/api/admin/tutors/invite',
      { method: 'POST', body: JSON.stringify(payload) }
    );
  },

  async sendTutorEmail(payload: { message: string; subject?: string; courseId?: string }) {
    return apiFetch<{ success: boolean; count: number; sent: { email: string; sent: boolean }[] }>(
      '/api/tutor/email/send',
      { method: 'POST', body: JSON.stringify(payload) }
    );
  },
};

// Types used by tutor pages
export type CourseLevel = 'Beginner' | 'Intermediate' | 'Advanced';

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

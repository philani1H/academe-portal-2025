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

// Shared types used by tutor pages
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
  tests: Test[];
  nextSession?: string;
  progress?: number;
  materials?: { id: string; name: string; uploadDate: string }[];
}

export interface Question {
  id: string;
  text: string;
  type: 'multiple-choice' | 'true-false' | 'short-answer' | 'essay';
  options?: string[];
  correctAnswer?: string;
  points: number;
  explanation?: string;
}

export interface Test {
  id: string;
  title: string;
  description?: string;
  courseId: string;
  dueDate: string;
  questions: Question[];
  totalPoints: number;
  submissions: number;
  averageScore: number;
  status?: 'draft' | 'published' | 'closed';
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

function ensureArray<T>(value: any, fallback: T[] = []): T[] {
  return Array.isArray(value) ? value : fallback;
}

export const api = {
  async getCourses(): Promise<Course[]> {
    const data = await apiFetch<any>('/courses');
    const rows = ensureArray<any>(data);
    return rows.map((r) => ({
      id: String(r.id ?? r.ID ?? crypto.randomUUID()),
      name: r.title ?? r.name ?? 'Course',
      description: r.description ?? '',
      category: r.category ?? r.department ?? 'General',
      level: 'Beginner',
      duration: r.duration ?? '',
      color: '#4f46e5',
      students: r.students ?? 0,
      tests: [],
      nextSession: r.nextSession ?? new Date().toISOString(),
      progress: Number(r.progress ?? 0),
      materials: [],
    }));
  },

  async createCourse(input: { name: string; description: string; category?: string; level?: CourseLevel; duration?: string }): Promise<Course> {
    const payload = {
      title: input.name,
      description: input.description,
      department: input.category ?? 'General',
      tutorId: 'tutor',
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      category: input.category ?? 'General',
    };
    const r = await apiFetch<any>('/courses', { method: 'POST', body: JSON.stringify(payload) });
    return {
      id: String(r.id ?? r.ID ?? crypto.randomUUID()),
      name: r.title ?? input.name,
      description: r.description ?? input.description,
      category: payload.category,
      level: input.level ?? 'Beginner',
      duration: input.duration ?? '',
      color: '#4f46e5',
      students: 0,
      tests: [],
      nextSession: new Date().toISOString(),
      progress: 0,
      materials: [],
    };
  },

  async getStudents(): Promise<Student[]> {
    const data = await apiFetch<any>('/students');
    const rows = ensureArray<any>(data);
    return rows.map((s) => ({
      id: String(s.id),
      name: s.name ?? 'Student',
      email: s.email ?? '',
      status: (s.status as any) ?? 'active',
      progress: Number(s.progress ?? 0),
      lastActivity: s.lastActivity ?? new Date().toISOString(),
      enrolledCourses: ensureArray<string>(s.enrolledCourses),
      joinDate: s.joinDate ?? new Date().toISOString(),
      totalAssignments: Number(s.totalAssignments ?? 0),
      completedAssignments: Number(s.completedAssignments ?? 0),
      avatar: s.avatar,
    }));
  },

  async addStudents(emails: string[]): Promise<Student[]> {
    const res = await apiFetch<any>('/students/bulk', { method: 'POST', body: JSON.stringify({ emails }) });
    const ids = ensureArray<any>(res?.ids).map((x) => String(x));
    const all = await api.getStudents();
    return all.filter((s) => ids.includes(String(s.id)));
  },

  async updateStudent(studentId: string, updates: Partial<Student>): Promise<Student> {
    const res = await apiFetch<any>(`/users/${encodeURIComponent(studentId)}`, { method: 'PUT', body: JSON.stringify(updates) });
    const s = res;
    return {
      id: String(s.id ?? studentId),
      name: s.name ?? updates.name ?? 'Student',
      email: s.email ?? updates.email ?? '',
      status: (s.status as any) ?? updates.status ?? 'active',
      progress: Number(s.progress ?? 0),
      lastActivity: s.updated_at ?? new Date().toISOString(),
      enrolledCourses: [],
      joinDate: s.created_at ?? new Date().toISOString(),
      totalAssignments: 0,
      completedAssignments: 0,
      avatar: undefined,
    };
  },

  async deleteStudent(studentId: string): Promise<void> {
    await apiFetch<any>(`/users/${encodeURIComponent(studentId)}`, { method: 'DELETE' });
  },

  async getTests(): Promise<Test[]> {
    const data = await apiFetch<any>('/tests');
    const rows = ensureArray<any>(data);
    return rows.map((t) => ({
      id: String(t.id),
      title: t.title ?? 'Test',
      description: t.description ?? '',
      courseId: String(t.course_id ?? t.courseId ?? ''),
      dueDate: t.due_date ?? t.dueDate ?? new Date().toISOString(),
      questions: (() => { try { return JSON.parse(t.questions || '[]'); } catch { return []; } })(),
      totalPoints: Number(t.total_points ?? t.totalPoints ?? 0),
      submissions: Number(t.submissions ?? 0),
      averageScore: Number(t.averageScore ?? 0),
      status: (t.status as any) ?? 'draft',
    }));
  },

  async createTest(input: { title: string; description?: string; dueDate?: string; courseId: string; questions: Question[] }): Promise<Test> {
    const payload = {
      title: input.title,
      description: input.description ?? '',
      dueDate: input.dueDate ?? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      courseId: input.courseId,
      questions: input.questions,
      totalPoints: input.questions?.reduce((s, q) => s + (q.points || 0), 0) ?? 0,
    };
    const t = await apiFetch<any>('/tests', { method: 'POST', body: JSON.stringify(payload) });
    return {
      id: String(t.id),
      title: t.title,
      description: t.description,
      courseId: String(t.courseId),
      dueDate: t.dueDate,
      questions: ensureArray<Question>(t.questions),
      totalPoints: Number(t.totalPoints ?? 0),
      submissions: 0,
      averageScore: 0,
      status: 'draft',
    };
  },

  async getNotifications(): Promise<Notification[]> {
    const data = await apiFetch<any>('/notifications');
    const rows = ensureArray<any>(data);
    return rows.map((n) => ({
      id: String(n.id ?? crypto.randomUUID()),
      message: n.message ?? n.title ?? '',
      type: (n.type as any) ?? 'info',
      read: Boolean(n.read ?? false),
      timestamp: n.created_at ?? n.timestamp ?? new Date().toISOString(),
      priority: 'medium',
    }));
  },

  async createNotification(message: string, priority: Notification['priority'] = 'medium'): Promise<Notification> {
    const res = await apiFetch<any>('/notifications', { method: 'POST', body: JSON.stringify({ title: 'Notification', message, type: priority === 'high' ? 'warning' : 'info' }) });
    return {
      id: String(res?.id ?? crypto.randomUUID()),
      message,
      type: priority === 'high' ? 'warning' : 'info',
      read: false,
      timestamp: new Date().toISOString(),
      priority,
    };
  },

  async getAnalytics(): Promise<Analytics> {
    const stats = await apiFetch<any>('/admin/stats');
    const s = stats ?? {};
    const totalStudents = Number(s.tutors ? 0 : 0) + 0; // placeholder not used
    return {
      totalStudents: Number(s.students ?? s.data?.students ?? 0),
      activeStudents: Number(s.activeStudents ?? 0),
      totalCourses: Number(s.courses ?? 0),
      completionRate: Number(s.completionRate ?? 0),
      averageGrade: Number(s.averageGrade ?? 0),
      monthlyGrowth: Number(s.monthlyGrowth ?? 0),
      courseStats: [],
      monthlyData: [],
    };
  },
};

export type { Course as ApiCourse, Student as ApiStudent, Test as ApiTest, Notification as ApiNotification, Analytics as ApiAnalytics };


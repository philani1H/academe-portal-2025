import { apiFetch } from '@/lib/api'

// Types
export interface DashboardStats {
  totalUsers: number
  activeUsers: number
  totalCourses: number
  activeCourses: number
  newUsersToday: number
  activeStudents: number
  activeTutors: number
  pendingApprovals: number
}

export interface User {
  id: string
  name: string
  email: string
  role: 'admin' | 'tutor' | 'student'
  status: 'active' | 'pending' | 'inactive' | 'rejected'
  createdAt: string
  lastActive?: string
  department?: string
  specialization?: string
  avatar?: string
}

export interface Tutor extends User {
  role: 'tutor'
  department: string
  specialization: string
  courses: string[]
  rating?: number
  students?: number
}

export interface Student extends User {
  role: 'student'
  enrolledCourses: string[]
  progress?: number
  grade?: number
}

export interface Course {
  id: string
  name: string
  description: string
  department: string
  tutorId: string
  status: 'active' | 'pending' | 'inactive'
  students: number
  createdAt: string
  startDate: string
  endDate: string
  color: string
}

export interface Notification {
  id: string
  title: string
  message: string
  date: string
  type: 'system' | 'course' | 'user' | 'approval'
  status: 'sent' | 'draft'
  recipients: {
    tutors: boolean
    students: boolean
    specific?: string[]
  }
  read: boolean
}

export interface Department {
  id: string
  name: string
  courses: number
  tutors: number
  students: number
  color: string
}

// Dashboard API Service
export class DashboardService {
  // Admin Dashboard APIs
  static async getAdminStats(): Promise<DashboardStats> {
    try {
      const stats = await apiFetch<DashboardStats>('/api/admin/dashboard/stats')
      return stats || {
        totalUsers: 0,
        activeUsers: 0,
        totalCourses: 0,
        activeCourses: 0,
        newUsersToday: 0,
        activeStudents: 0,
        activeTutors: 0,
        pendingApprovals: 0
      }
    } catch (error) {
      console.error('Error fetching admin stats:', error)
      return {
        totalUsers: 0,
        activeUsers: 0,
        totalCourses: 0,
        activeCourses: 0,
        newUsersToday: 0,
        activeStudents: 0,
        activeTutors: 0,
        pendingApprovals: 0
      }
    }
  }

  static async getAdminUsers(): Promise<User[]> {
    try {
      const users = await apiFetch<User[]>('/api/admin/users')
      return users || []
    } catch (error) {
      console.error('Error fetching admin users:', error)
      return []
    }
  }

  static async getAdminTutors(): Promise<Tutor[]> {
    try {
      const tutors = await apiFetch<Tutor[]>('/api/admin/tutors')
      return tutors || []
    } catch (error) {
      console.error('Error fetching admin tutors:', error)
      return []
    }
  }

  static async getAdminStudents(): Promise<Student[]> {
    try {
      const students = await apiFetch<Student[]>('/api/admin/students')
      return students || []
    } catch (error) {
      console.error('Error fetching admin students:', error)
      return []
    }
  }

  static async getAdminCourses(): Promise<Course[]> {
    try {
      const courses = await apiFetch<Course[]>('/api/admin/courses')
      return courses || []
    } catch (error) {
      console.error('Error fetching admin courses:', error)
      return []
    }
  }

  static async getAdminDepartments(): Promise<Department[]> {
    try {
      const departments = await apiFetch<Department[]>('/api/admin/departments')
      return departments || []
    } catch (error) {
      console.error('Error fetching admin departments:', error)
      return []
    }
  }

  static async getAdminNotifications(): Promise<Notification[]> {
    try {
      const notifications = await apiFetch<Notification[]>('/api/admin/notifications')
      return notifications || []
    } catch (error) {
      console.error('Error fetching admin notifications:', error)
      return []
    }
  }

  // Student Dashboard APIs
  static async getStudentDashboard(studentId: string): Promise<any> {
    try {
      const dashboard = await apiFetch<any>(`/api/student/dashboard?studentId=${studentId}`)
      return dashboard || {}
    } catch (error) {
      console.error('Error fetching student dashboard:', error)
      return {}
    }
  }

  static async getStudentCourses(studentId: string): Promise<Course[]> {
    try {
      const courses = await apiFetch<Course[]>(`/api/student/courses?studentId=${studentId}`)
      return courses || []
    } catch (error) {
      console.error('Error fetching student courses:', error)
      return []
    }
  }

  static async getStudentTests(studentId: string): Promise<any[]> {
    try {
      const tests = await apiFetch<any[]>(`/api/student/tests?studentId=${studentId}`)
      return tests || []
    } catch (error) {
      console.error('Error fetching student tests:', error)
      return []
    }
  }

  static async getStudentEvents(studentId: string): Promise<any[]> {
    try {
      const events = await apiFetch<any[]>(`/api/student/events?studentId=${studentId}`)
      return events || []
    } catch (error) {
      console.error('Error fetching student events:', error)
      return []
    }
  }

  // Tutor Dashboard APIs
  static async getTutorDashboard(tutorId: string): Promise<any> {
    try {
      const dashboard = await apiFetch<any>(`/api/tutor/dashboard?tutorId=${tutorId}`)
      return dashboard || {}
    } catch (error) {
      console.error('Error fetching tutor dashboard:', error)
      return {}
    }
  }

  static async getTutorSessions(tutorId: string): Promise<any[]> {
    try {
      const sessions = await apiFetch<any[]>(`/api/tutor/sessions?tutorId=${tutorId}`)
      return sessions || []
    } catch (error) {
      console.error('Error fetching tutor sessions:', error)
      return []
    }
  }

  static async getTutorStudents(tutorId: string): Promise<Student[]> {
    try {
      const students = await apiFetch<Student[]>(`/api/tutor/students?tutorId=${tutorId}`)
      return students || []
    } catch (error) {
      console.error('Error fetching tutor students:', error)
      return []
    }
  }

  // Content Management APIs
  static async getContentData(): Promise<any> {
    try {
      const content = await apiFetch<any>('/api/admin/content/all')
      return content || {}
    } catch (error) {
      console.error('Error fetching content data:', error)
      return {}
    }
  }

  // File Upload API
  static async uploadFile(file: File): Promise<string> {
    try {
      const formData = new FormData()
      formData.append('file', file)
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })
      
      if (!response.ok) {
        throw new Error('Upload failed')
      }
      
      const data = await response.json()
      return data.url || data
    } catch (error) {
      console.error('Error uploading file:', error)
      throw error
    }
  }

  // CRUD Operations
  static async createUser(userData: Partial<User>): Promise<User> {
    try {
      const user = await apiFetch<User>('/api/admin/users', {
        method: 'POST',
        body: JSON.stringify(userData)
      })
      return user
    } catch (error) {
      console.error('Error creating user:', error)
      throw error
    }
  }

  static async updateUser(userId: string, userData: Partial<User>): Promise<User> {
    try {
      const user = await apiFetch<User>(`/api/admin/users/${userId}`, {
        method: 'PUT',
        body: JSON.stringify(userData)
      })
      return user
    } catch (error) {
      console.error('Error updating user:', error)
      throw error
    }
  }

  static async deleteUser(userId: string): Promise<void> {
    try {
      await apiFetch(`/api/admin/users/${userId}`, {
        method: 'DELETE'
      })
    } catch (error) {
      console.error('Error deleting user:', error)
      throw error
    }
  }

  static async createCourse(courseData: Partial<Course>): Promise<Course> {
    try {
      const course = await apiFetch<Course>('/api/admin/courses', {
        method: 'POST',
        body: JSON.stringify(courseData)
      })
      return course
    } catch (error) {
      console.error('Error creating course:', error)
      throw error
    }
  }

  static async updateCourse(courseId: string, courseData: Partial<Course>): Promise<Course> {
    try {
      const course = await apiFetch<Course>(`/api/admin/courses/${courseId}`, {
        method: 'PUT',
        body: JSON.stringify(courseData)
      })
      return course
    } catch (error) {
      console.error('Error updating course:', error)
      throw error
    }
  }

  static async deleteCourse(courseId: string): Promise<void> {
    try {
      await apiFetch(`/api/admin/courses/${courseId}`, {
        method: 'DELETE'
      })
    } catch (error) {
      console.error('Error deleting course:', error)
      throw error
    }
  }

  // Notification APIs
  static async sendNotification(notificationData: Partial<Notification>): Promise<Notification> {
    try {
      const notification = await apiFetch<Notification>('/api/admin/notifications', {
        method: 'POST',
        body: JSON.stringify(notificationData)
      })
      return notification
    } catch (error) {
      console.error('Error sending notification:', error)
      throw error
    }
  }

  static async markNotificationAsRead(notificationId: string): Promise<void> {
    try {
      await apiFetch(`/api/admin/notifications/${notificationId}/read`, {
        method: 'PUT'
      })
    } catch (error) {
      console.error('Error marking notification as read:', error)
      throw error
    }
  }

  // Bulk Operations
  static async bulkApproveUsers(userIds: string[]): Promise<void> {
    try {
      await apiFetch('/api/admin/users/bulk-approve', {
        method: 'POST',
        body: JSON.stringify({ userIds })
      })
    } catch (error) {
      console.error('Error bulk approving users:', error)
      throw error
    }
  }

  static async bulkRejectUsers(userIds: string[]): Promise<void> {
    try {
      await apiFetch('/api/admin/users/bulk-reject', {
        method: 'POST',
        body: JSON.stringify({ userIds })
      })
    } catch (error) {
      console.error('Error bulk rejecting users:', error)
      throw error
    }
  }
}

export default DashboardService
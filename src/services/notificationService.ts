import { apiFetch } from '@/lib/api'

export interface Notification {
  id: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  read: boolean
  createdAt: string
  userId?: string
  courseId?: string
  assignmentId?: string
  testId?: string
}

export interface NotificationSettings {
  emailNotifications: boolean
  pushNotifications: boolean
  assignmentReminders: boolean
  testReminders: boolean
  courseUpdates: boolean
}

class NotificationService {
  private notifications: Notification[] = []
  private listeners: ((notifications: Notification[]) => void)[] = []

  // Subscribe to notification updates
  subscribe(listener: (notifications: Notification[]) => void) {
    this.listeners.push(listener)
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener)
    }
  }

  // Notify all listeners
  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.notifications))
  }

  // Get all notifications
  async getNotifications(userId?: string): Promise<Notification[]> {
    try {
      const url = userId ? `/api/notifications?userId=${userId}` : '/api/notifications'
      const notifications = await apiFetch<Notification[]>(url)
      this.notifications = notifications
      this.notifyListeners()
      return notifications
    } catch (error) {
      console.error('Error fetching notifications:', error)
      return []
    }
  }

  // Get unread notifications count
  async getUnreadCount(userId?: string): Promise<number> {
    try {
      const url = userId ? `/api/notifications/unread?userId=${userId}` : '/api/notifications/unread'
      const count = await apiFetch<number>(url)
      return count
    } catch (error) {
      console.error('Error fetching unread count:', error)
      return 0
    }
  }

  // Mark notification as read
  async markAsRead(notificationId: string): Promise<void> {
    try {
      await apiFetch(`/api/notifications/${notificationId}/read`, {
        method: 'PUT'
      })
      
      // Update local state
      this.notifications = this.notifications.map(n => 
        n.id === notificationId ? { ...n, read: true } : n
      )
      this.notifyListeners()
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  // Mark all notifications as read
  async markAllAsRead(userId?: string): Promise<void> {
    try {
      const url = userId ? `/api/notifications/mark-all-read?userId=${userId}` : '/api/notifications/mark-all-read'
      await apiFetch(url, {
        method: 'PUT'
      })
      
      // Update local state
      this.notifications = this.notifications.map(n => ({ ...n, read: true }))
      this.notifyListeners()
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
    }
  }

  // Create notification
  async createNotification(notification: Omit<Notification, 'id' | 'createdAt' | 'read'>): Promise<Notification> {
    try {
      const newNotification = await apiFetch<Notification>('/api/notifications', {
        method: 'POST',
        body: JSON.stringify({
          ...notification,
          read: false,
          createdAt: new Date().toISOString()
        })
      })
      
      // Add to local state
      this.notifications.unshift(newNotification)
      this.notifyListeners()
      
      return newNotification
    } catch (error) {
      console.error('Error creating notification:', error)
      throw error
    }
  }

  // Delete notification
  async deleteNotification(notificationId: string): Promise<void> {
    try {
      await apiFetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE'
      })
      
      // Remove from local state
      this.notifications = this.notifications.filter(n => n.id !== notificationId)
      this.notifyListeners()
    } catch (error) {
      console.error('Error deleting notification:', error)
    }
  }

  // Get notification settings
  async getNotificationSettings(userId: string): Promise<NotificationSettings> {
    try {
      const settings = await apiFetch<NotificationSettings>(`/api/notifications/settings?userId=${userId}`)
      return settings
    } catch (error) {
      console.error('Error fetching notification settings:', error)
      return {
        emailNotifications: true,
        pushNotifications: true,
        assignmentReminders: true,
        testReminders: true,
        courseUpdates: true
      }
    }
  }

  // Update notification settings
  async updateNotificationSettings(userId: string, settings: Partial<NotificationSettings>): Promise<void> {
    try {
      await apiFetch(`/api/notifications/settings?userId=${userId}`, {
        method: 'PUT',
        body: JSON.stringify(settings)
      })
    } catch (error) {
      console.error('Error updating notification settings:', error)
    }
  }

  // Send notification to specific users
  async sendNotificationToUsers(
    userIds: string[],
    notification: Omit<Notification, 'id' | 'createdAt' | 'read' | 'userId'>
  ): Promise<void> {
    try {
      await apiFetch('/api/notifications/send', {
        method: 'POST',
        body: JSON.stringify({
          userIds,
          notification
        })
      })
    } catch (error) {
      console.error('Error sending notification to users:', error)
    }
  }

  // Send notification to all users of a role
  async sendNotificationToRole(
    role: 'admin' | 'tutor' | 'student',
    notification: Omit<Notification, 'id' | 'createdAt' | 'read' | 'userId'>
  ): Promise<void> {
    try {
      await apiFetch('/api/notifications/send-to-role', {
        method: 'POST',
        body: JSON.stringify({
          role,
          notification
        })
      })
    } catch (error) {
      console.error('Error sending notification to role:', error)
    }
  }

  // Get current notifications (from local state)
  getCurrentNotifications(): Notification[] {
    return this.notifications
  }

  // Get unread notifications (from local state)
  getUnreadNotifications(): Notification[] {
    return this.notifications.filter(n => !n.read)
  }

  // Get notifications by type
  getNotificationsByType(type: Notification['type']): Notification[] {
    return this.notifications.filter(n => n.type === type)
  }

  // Clear all notifications (local state)
  clearNotifications(): void {
    this.notifications = []
    this.notifyListeners()
  }
}

export default new NotificationService()
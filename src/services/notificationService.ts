import { executeQuery } from '../lib/db';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'system' | 'course' | 'user' | 'approval';
  recipient_id: string;
  read: boolean;
  created_at: string;
}

export interface Announcement {
  id: string;
  course_id: string;
  title: string;
  content: string;
  created_at: string;
}

export async function getNotifications(userId: string): Promise<Notification[]> {
  try {
    return await executeQuery<Notification[]>(
      'SELECT * FROM notifications WHERE recipient_id = ? ORDER BY created_at DESC',
      [userId]
    );
  } catch (error) {
    console.error('Error getting notifications:', error);
    throw error;
  }
}

export async function getUnreadNotificationCount(userId: string): Promise<number> {
  try {
    const result = await executeQuery<[{count: number}]>(
      'SELECT COUNT(*) as count FROM notifications WHERE recipient_id = ? AND read = false',
      [userId]
    );
    return result[0].count;
  } catch (error) {
    console.error('Error getting unread notification count:', error);
    throw error;
  }
}

export async function markNotificationAsRead(notificationId: string): Promise<void> {
  try {
    await executeQuery(
      'UPDATE notifications SET read = true WHERE id = ?',
      [notificationId]
    );
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
}

export async function createNotification(notification: Omit<Notification, 'id' | 'created_at'>): Promise<string> {
  try {
    const id = `n-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    await executeQuery(
      'INSERT INTO notifications (id, title, message, type, recipient_id, read) VALUES (?, ?, ?, ?, ?, ?)',
      [id, notification.title, notification.message, notification.type, notification.recipient_id, notification.read]
    );
    return id;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
}

export async function getCourseAnnouncements(courseId: string): Promise<Announcement[]> {
  try {
    return await executeQuery<Announcement[]>(
      'SELECT * FROM announcements WHERE course_id = ? ORDER BY created_at DESC',
      [courseId]
    );
  } catch (error) {
    console.error('Error getting course announcements:', error);
    throw error;
  }
}

export async function createAnnouncement(announcement: Omit<Announcement, 'id' | 'created_at'>): Promise<string> {
  try {
    const id = `a-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    await executeQuery(
      'INSERT INTO announcements (id, course_id, title, content) VALUES (?, ?, ?, ?)',
      [id, announcement.course_id, announcement.title, announcement.content]
    );
    return id;
  } catch (error) {
    console.error('Error creating announcement:', error);
    throw error;
  }
}
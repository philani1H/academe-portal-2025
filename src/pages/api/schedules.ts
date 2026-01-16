import type { NextApiRequest, NextApiResponse } from 'next';
import Database from 'better-sqlite3';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const dbPath = path.join(process.cwd(), 'APP-Database.db');

interface Schedule {
  id: string;
  title: string;
  description?: string;
  courseId?: string;
  userId?: string;
  userRole?: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  location?: string;
  type: string;
  color?: string;
  isRecurring: boolean;
  isActive: boolean;
  created_at?: string;
  updated_at?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const db = new Database(dbPath);

  try {
    if (req.method === 'GET') {
      // Get all schedules or filter by query parameters
      const { userId, userRole, dayOfWeek, type } = req.query;

      let query = 'SELECT * FROM schedules WHERE isActive = 1';
      const params: any[] = [];

      if (userId) {
        query += ' AND (userId = ? OR userId IS NULL)';
        params.push(userId);
      }

      if (userRole) {
        query += ' AND (userRole = ? OR userRole = "all")';
        params.push(userRole);
      }

      if (dayOfWeek) {
        query += ' AND dayOfWeek = ?';
        params.push(dayOfWeek);
      }

      if (type) {
        query += ' AND type = ?';
        params.push(type);
      }

      query += ' ORDER BY dayOfWeek, startTime';

      const stmt = db.prepare(query);
      const schedules = stmt.all(...params);

      res.status(200).json(schedules);
    } else if (req.method === 'POST') {
      // Create a new schedule
      const scheduleData: Partial<Schedule> = req.body;

      const id = uuidv4();
      const now = new Date().toISOString();

      const stmt = db.prepare(`
        INSERT INTO schedules
        (id, title, description, courseId, userId, userRole, dayOfWeek, startTime, endTime, location, type, color, isRecurring, isActive, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      stmt.run(
        id,
        scheduleData.title,
        scheduleData.description || null,
        scheduleData.courseId || null,
        scheduleData.userId || null,
        scheduleData.userRole || 'all',
        scheduleData.dayOfWeek,
        scheduleData.startTime,
        scheduleData.endTime,
        scheduleData.location || null,
        scheduleData.type || 'class',
        scheduleData.color || '#3b82f6',
        scheduleData.isRecurring !== false ? 1 : 0,
        scheduleData.isActive !== false ? 1 : 0,
        now,
        now
      );

      const newSchedule = db.prepare('SELECT * FROM schedules WHERE id = ?').get(id);
      res.status(201).json(newSchedule);
    } else if (req.method === 'PUT') {
      // Update an existing schedule
      const { id, ...updates }: Partial<Schedule> & { id: string } = req.body;

      if (!id) {
        res.status(400).json({ error: 'Schedule ID is required' });
        return;
      }

      const now = new Date().toISOString();
      const updateFields: string[] = [];
      const params: any[] = [];

      Object.keys(updates).forEach((key) => {
        if (key !== 'id' && key !== 'created_at') {
          updateFields.push(`${key} = ?`);
          params.push((updates as any)[key]);
        }
      });

      updateFields.push('updated_at = ?');
      params.push(now);
      params.push(id);

      const stmt = db.prepare(`
        UPDATE schedules
        SET ${updateFields.join(', ')}
        WHERE id = ?
      `);

      stmt.run(...params);

      const updatedSchedule = db.prepare('SELECT * FROM schedules WHERE id = ?').get(id);
      res.status(200).json(updatedSchedule);
    } else if (req.method === 'DELETE') {
      // Soft delete a schedule
      const { id } = req.query;

      if (!id || typeof id !== 'string') {
        res.status(400).json({ error: 'Schedule ID is required' });
        return;
      }

      const now = new Date().toISOString();
      const stmt = db.prepare('UPDATE schedules SET isActive = 0, updated_at = ? WHERE id = ?');
      stmt.run(now, id);

      res.status(200).json({ message: 'Schedule deleted successfully' });
    } else {
      res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
      res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error: any) {
    console.error('Error handling schedule request:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  } finally {
    db.close();
  }
}

import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, '../../APP-Database.db');
const db = new Database(dbPath);

try {
  // Create schedules table if it doesn't exist
  db.exec(`
    CREATE TABLE IF NOT EXISTS schedules (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      courseId TEXT,
      userId TEXT,
      userRole TEXT,
      dayOfWeek TEXT NOT NULL,
      startTime TEXT NOT NULL,
      endTime TEXT NOT NULL,
      location TEXT,
      type TEXT NOT NULL DEFAULT 'class',
      color TEXT,
      isRecurring INTEGER NOT NULL DEFAULT 1,
      isActive INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  console.log('✅ Schedules table created successfully');

  // Insert sample schedule data
  const sampleSchedules = [
    {
      id: 'schedule-1',
      title: 'Mathematics 101',
      description: 'Introduction to Calculus',
      courseId: null,
      userId: null,
      userRole: 'all',
      dayOfWeek: 'Monday',
      startTime: '09:00',
      endTime: '10:30',
      location: 'Room 101',
      type: 'class',
      color: '#3b82f6',
      isRecurring: 1,
      isActive: 1
    },
    {
      id: 'schedule-2',
      title: 'Physics Lab',
      description: 'Practical Physics Session',
      courseId: null,
      userId: null,
      userRole: 'all',
      dayOfWeek: 'Monday',
      startTime: '11:00',
      endTime: '13:00',
      location: 'Physics Lab A',
      type: 'class',
      color: '#10b981',
      isRecurring: 1,
      isActive: 1
    },
    {
      id: 'schedule-3',
      title: 'English Literature',
      description: 'Modern Poetry Analysis',
      courseId: null,
      userId: null,
      userRole: 'all',
      dayOfWeek: 'Tuesday',
      startTime: '09:00',
      endTime: '10:30',
      location: 'Room 205',
      type: 'class',
      color: '#f59e0b',
      isRecurring: 1,
      isActive: 1
    },
    {
      id: 'schedule-4',
      title: 'Chemistry Tutorial',
      description: 'Organic Chemistry Review',
      courseId: null,
      userId: null,
      userRole: 'all',
      dayOfWeek: 'Tuesday',
      startTime: '14:00',
      endTime: '15:30',
      location: 'Chemistry Lab',
      type: 'class',
      color: '#8b5cf6',
      isRecurring: 1,
      isActive: 1
    },
    {
      id: 'schedule-5',
      title: 'Biology Lecture',
      description: 'Cell Structure and Function',
      courseId: null,
      userId: null,
      userRole: 'all',
      dayOfWeek: 'Wednesday',
      startTime: '10:00',
      endTime: '11:30',
      location: 'Lecture Hall B',
      type: 'class',
      color: '#ec4899',
      isRecurring: 1,
      isActive: 1
    },
    {
      id: 'schedule-6',
      title: 'Computer Science',
      description: 'Data Structures and Algorithms',
      courseId: null,
      userId: null,
      userRole: 'all',
      dayOfWeek: 'Wednesday',
      startTime: '13:00',
      endTime: '14:30',
      location: 'Computer Lab 1',
      type: 'class',
      color: '#06b6d4',
      isRecurring: 1,
      isActive: 1
    },
    {
      id: 'schedule-7',
      title: 'History Seminar',
      description: 'South African History',
      courseId: null,
      userId: null,
      userRole: 'all',
      dayOfWeek: 'Thursday',
      startTime: '09:00',
      endTime: '10:30',
      location: 'Room 303',
      type: 'class',
      color: '#ef4444',
      isRecurring: 1,
      isActive: 1
    },
    {
      id: 'schedule-8',
      title: 'Economics Workshop',
      description: 'Microeconomics Principles',
      courseId: null,
      userId: null,
      userRole: 'all',
      dayOfWeek: 'Thursday',
      startTime: '11:00',
      endTime: '12:30',
      location: 'Room 201',
      type: 'class',
      color: '#f97316',
      isRecurring: 1,
      isActive: 1
    },
    {
      id: 'schedule-9',
      title: 'Geography Field Trip',
      description: 'Urban Geography Study',
      courseId: null,
      userId: null,
      userRole: 'all',
      dayOfWeek: 'Friday',
      startTime: '09:00',
      endTime: '12:00',
      location: 'Off Campus',
      type: 'event',
      color: '#14b8a6',
      isRecurring: 1,
      isActive: 1
    },
    {
      id: 'schedule-10',
      title: 'Art and Design',
      description: 'Creative Workshop',
      courseId: null,
      userId: null,
      userRole: 'all',
      dayOfWeek: 'Friday',
      startTime: '13:00',
      endTime: '15:00',
      location: 'Art Studio',
      type: 'class',
      color: '#a855f7',
      isRecurring: 1,
      isActive: 1
    }
  ];

  const insertStmt = db.prepare(`
    INSERT OR REPLACE INTO schedules
    (id, title, description, courseId, userId, userRole, dayOfWeek, startTime, endTime, location, type, color, isRecurring, isActive)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const schedule of sampleSchedules) {
    insertStmt.run(
      schedule.id,
      schedule.title,
      schedule.description,
      schedule.courseId,
      schedule.userId,
      schedule.userRole,
      schedule.dayOfWeek,
      schedule.startTime,
      schedule.endTime,
      schedule.location,
      schedule.type,
      schedule.color,
      schedule.isRecurring,
      schedule.isActive
    );
  }

  console.log(`✅ Inserted ${sampleSchedules.length} sample schedules`);

  db.close();
  console.log('✅ Database connection closed');
  process.exit(0);
} catch (error) {
  console.error('❌ Error:', error);
  db.close();
  process.exit(1);
}

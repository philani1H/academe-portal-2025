import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    switch (req.method) {
      case 'GET':
        return await getTutorSessions(req, res);
      case 'POST':
        return await createSession(req, res);
      case 'PUT':
        return await updateSession(req, res);
      case 'DELETE':
        return await deleteSession(req, res);
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Tutor sessions API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function getTutorSessions(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { tutorId, date } = req.query;

    if (!tutorId || typeof tutorId !== 'string') {
      return res.status(400).json({ error: 'Tutor ID is required' });
    }

    // For now, return mock session data
    // In a real implementation, you would query a sessions table
    const sessions = [
      {
        id: '1',
        courseName: 'Mathematics Grade 12',
        studentName: 'John Doe',
        studentEmail: 'john@example.com',
        date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        time: '10:00 AM',
        duration: 60,
        type: '1-on-1',
        status: 'scheduled',
        location: 'Online',
        notes: 'Focus on calculus problems',
        materials: [
          {
            id: '1',
            name: 'Calculus Worksheet 1',
            type: 'pdf',
            url: '/materials/calculus-worksheet-1.pdf'
          }
        ]
      },
      {
        id: '2',
        courseName: 'Physics Grade 11',
        studentName: 'Jane Smith',
        studentEmail: 'jane@example.com',
        date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        time: '2:00 PM',
        duration: 90,
        type: 'Group',
        status: 'scheduled',
        location: 'Online',
        notes: 'Mechanics and motion',
        materials: [
          {
            id: '2',
            name: 'Physics Lab Report Template',
            type: 'doc',
            url: '/materials/physics-lab-template.doc'
          }
        ]
      },
      {
        id: '3',
        courseName: 'Mathematics Grade 12',
        studentName: 'Mike Johnson',
        studentEmail: 'mike@example.com',
        date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        time: '3:00 PM',
        duration: 60,
        type: '1-on-1',
        status: 'completed',
        location: 'Online',
        notes: 'Completed algebra review',
        materials: [],
        feedback: 'Great progress on quadratic equations!'
      }
    ];

    // Filter by date if provided
    let filteredSessions = sessions;
    if (date) {
      const targetDate = new Date(date as string);
      filteredSessions = sessions.filter(session => {
        const sessionDate = new Date(session.date);
        return sessionDate.toDateString() === targetDate.toDateString();
      });
    }

    return res.status(200).json(filteredSessions);
  } catch (error) {
    console.error('Error fetching tutor sessions:', error);
    return res.status(500).json({ error: 'Failed to fetch sessions' });
  }
}

async function createSession(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { tutorId, courseId, studentId, date, time, duration, type, location, notes } = req.body;

    if (!tutorId || !courseId || !studentId || !date || !time || !duration) {
      return res.status(400).json({ error: 'Required fields are missing' });
    }

    // In a real implementation, you would create a session in the database
    const newSession = {
      id: Date.now().toString(),
      courseId,
      studentId,
      tutorId,
      date,
      time,
      duration,
      type,
      location: location || 'Online',
      notes: notes || '',
      status: 'scheduled',
      createdAt: new Date().toISOString()
    };

    return res.status(201).json({
      message: 'Session created successfully',
      session: newSession
    });
  } catch (error) {
    console.error('Error creating session:', error);
    return res.status(500).json({ error: 'Failed to create session' });
  }
}

async function updateSession(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { sessionId, updates } = req.body;

    if (!sessionId || !updates) {
      return res.status(400).json({ error: 'Session ID and updates are required' });
    }

    // In a real implementation, you would update the session in the database
    const updatedSession = {
      id: sessionId,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    return res.status(200).json({
      message: 'Session updated successfully',
      session: updatedSession
    });
  } catch (error) {
    console.error('Error updating session:', error);
    return res.status(500).json({ error: 'Failed to update session' });
  }
}

async function deleteSession(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { sessionId } = req.query;

    if (!sessionId || typeof sessionId !== 'string') {
      return res.status(400).json({ error: 'Session ID is required' });
    }

    // In a real implementation, you would delete the session from the database
    return res.status(200).json({ message: 'Session deleted successfully' });
  } catch (error) {
    console.error('Error deleting session:', error);
    return res.status(500).json({ error: 'Failed to delete session' });
  }
}
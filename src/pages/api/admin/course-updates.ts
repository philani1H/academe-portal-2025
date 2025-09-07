import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import prisma from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);

  if (!session || session.user.role !== 'admin' && session.user.role !== 'tutor') {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method === 'POST') {
    try {
      const { courseId, updates, notificationType } = req.body;

      if (!courseId || !updates) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Update course information
      const updatedCourse = await prisma.course.update({
        where: { id: courseId },
        data: updates
      });

      // Create notification for students
      const notification = await prisma.notification.create({
        data: {
          type: notificationType || 'course',
          message: `Course ${updatedCourse.name} has been updated by ${session.user.name}`,
          courseId: courseId,
          senderId: session.user.id,
          read: false
        }
      });

      // Send SSE event to connected clients
      const sseData = {
        type: 'course_update',
        courseId,
        updates,
        notification
      };

      // Store the update in SSE buffer for real-time delivery
      global.sseClients?.forEach(client => {
        client.write(`data: ${JSON.stringify(sseData)}\n\n`);
      });

      return res.status(200).json({ success: true, course: updatedCourse, notification });
    } catch (error) {
      console.error('Error updating course:', error);
      return res.status(500).json({ error: 'Failed to update course' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
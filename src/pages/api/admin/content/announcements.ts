import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';
import { verifyAdminToken } from '@/lib/adminAuth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Verify admin authentication for all methods except GET (public access for display)
  if (req.method !== 'GET') {
    const user = verifyAdminToken(req);
    if (!user || user.role !== 'admin') {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Admin authentication required'
      });
    }
  }

  if (req.method === 'GET') {
    try {
      const announcements = await prisma.announcement.findMany({
        orderBy: [
          { pinned: 'desc' },
          { createdAt: 'desc' }
        ]
      });
      
      res.status(200).json(announcements);
    } catch (error) {
      console.error('Error fetching announcements:', error);
      res.status(500).json({ error: 'Failed to fetch announcements' });
    }
  } else if (req.method === 'POST') {
    try {
      const { title, content, type, pinned, mediaUrl, mediaType, department } = req.body;

      const announcement = await prisma.announcement.create({
        data: {
          title: title || content.slice(0, 50),
          content,
          type,
          pinned: pinned || false,
          mediaUrl,
          mediaType,
          authorId: 1, // Hardcoded system admin as requested
          department: department || null
        }
      });

      // Emit real-time update
      const io = (global as any).io;
      if (io) {
        io.emit('announcement-added', announcement);
      }

      res.status(201).json(announcement);
    } catch (error) {
      console.error('Error creating announcement:', error);
      res.status(500).json({ error: 'Failed to create announcement' });
    }
  } else if (req.method === 'PUT') {
    try {
      const { id, created_at, updatedAt, author, ...updateData } = req.body;
      
      const announcement = await prisma.announcement.update({
        where: { id: String(id) },
        data: updateData
      });

      res.status(200).json(announcement);
    } catch (error) {
      console.error('Error updating announcement:', error);
      res.status(500).json({ error: 'Failed to update announcement' });
    }
  } else if (req.method === 'DELETE') {
    try {
      const { id } = req.query;
      
      // We don't have an isActive field in the schema shown, but let's check if we should delete or soft delete.
      // The schema didn't show isActive, but the old code used it.
      // Let's re-read schema to be sure about isActive.
      // The schema I read: model Announcement { ... } did NOT show isActive.
      // So we should probably use delete() instead of update({ isActive: false }).
      await prisma.announcement.delete({
        where: { id: String(id) }
      });

      res.status(200).json({ message: 'Announcement deleted successfully' });
    } catch (error) {
      console.error('Error deleting announcement:', error);
      res.status(500).json({ error: 'Failed to delete announcement' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

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
      const announcements = await prisma.announcements.findMany({
        where: { isActive: true },
        orderBy: [
          { pinned: 'desc' },
          { created_at: 'desc' }
        ]
      });
      
      res.status(200).json(announcements);
    } catch (error) {
      console.error('Error fetching announcements:', error);
      res.status(500).json({ error: 'Failed to fetch announcements' });
    }
  } else if (req.method === 'POST') {
    try {
      const { title, content, type, pinned, mediaUrl, mediaType } = req.body;

      const announcement = await prisma.announcements.create({
        data: {
          title: title || content.slice(0, 50),
          content,
          type,
          pinned: pinned || false,
          mediaUrl,
          mediaType,
          isActive: true,
          authorId: 1, // Hardcoded system admin as requested
          department: null // No department assignment as requested
        }
      });

      res.status(201).json(announcement);
    } catch (error) {
      console.error('Error creating announcement:', error);
      res.status(500).json({ error: 'Failed to create announcement' });
    }
  } else if (req.method === 'PUT') {
    try {
      const { id, ...updateData } = req.body;
      
      const announcement = await prisma.announcements.update({
        where: { id: Number(id) },
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
      
      await prisma.announcements.update({
        where: { id: Number(id) },
        data: { isActive: false }
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

import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const announcements = await prisma.announcement.findMany({
        where: { isActive: true },
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
      const { content, type, pinned } = req.body;

      const announcement = await prisma.announcement.create({
        data: {
          content,
          type,
          pinned: pinned || false,
          isActive: true
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
      
      const announcement = await prisma.announcement.update({
        where: { id },
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
      
      await prisma.announcement.update({
        where: { id: id as string },
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
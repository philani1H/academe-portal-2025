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
      const teamMembers = await prisma.teamMember.findMany({
        where: { isActive: true },
        orderBy: { order: 'asc' }
      });
      
      res.status(200).json(teamMembers);
    } catch (error) {
      console.error('Error fetching team members:', error);
      res.status(500).json({ error: 'Failed to fetch team members' });
    }
  } else if (req.method === 'POST') {
    try {
      const { name, role, bio, image, order } = req.body;

      const teamMember = await prisma.teamMember.create({
        data: {
          name,
          role,
          bio,
          image,
          order: order || 0,
          isActive: true
        }
      });

      res.status(201).json(teamMember);
    } catch (error) {
      console.error('Error creating team member:', error);
      res.status(500).json({ error: 'Failed to create team member' });
    }
  } else if (req.method === 'PUT') {
    try {
      const { id, ...updateData } = req.body;
      
      const teamMember = await prisma.teamMember.update({
        where: { id },
        data: updateData
      });

      res.status(200).json(teamMember);
    } catch (error) {
      console.error('Error updating team member:', error);
      res.status(500).json({ error: 'Failed to update team member' });
    }
  } else if (req.method === 'DELETE') {
    try {
      const { id } = req.query;
      
      await prisma.teamMember.update({
        where: { id: id as string },
        data: { isActive: false }
      });

      res.status(200).json({ message: 'Team member deleted successfully' });
    } catch (error) {
      console.error('Error deleting team member:', error);
      res.status(500).json({ error: 'Failed to delete team member' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
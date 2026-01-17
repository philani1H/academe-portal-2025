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
      const aboutUsContent = await prisma.aboutUsContent.findFirst({
        where: { isActive: true },
        orderBy: { createdAt: 'desc' }
      });
      
      if (!aboutUsContent) {
        return res.status(404).json({ error: 'No about us content found' });
      }
      
      res.status(200).json(aboutUsContent);
    } catch (error) {
      console.error('Error fetching about us content:', error);
      res.status(500).json({ error: 'Failed to fetch about us content' });
    }
  } else if (req.method === 'POST') {
    try {
      const { goal, mission, rolesResponsibilities } = req.body;

      // Deactivate existing about us content
      await prisma.aboutUsContent.updateMany({
        where: { isActive: true },
        data: { isActive: false }
      });

      const aboutUsContent = await prisma.aboutUsContent.create({
        data: {
          goal,
          mission,
          rolesResponsibilities,
          isActive: true
        }
      });

      res.status(201).json(aboutUsContent);
    } catch (error) {
      console.error('Error creating about us content:', error);
      res.status(500).json({ error: 'Failed to create about us content' });
    }
  } else if (req.method === 'PUT') {
    try {
      const { id, ...updateData } = req.body;
      
      const aboutUsContent = await prisma.aboutUsContent.update({
        where: { id },
        data: updateData
      });

      res.status(200).json(aboutUsContent);
    } catch (error) {
      console.error('Error updating about us content:', error);
      res.status(500).json({ error: 'Failed to update about us content' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST', 'PUT']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
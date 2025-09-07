import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
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
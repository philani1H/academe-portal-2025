import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const { type } = req.query;
      
      const whereClause = type ? { type: type as string, isActive: true } : { isActive: true };
      
      const navigationItems = await prisma.navigationItem.findMany({
        where: whereClause,
        orderBy: { order: 'asc' }
      });
      
      res.status(200).json(navigationItems);
    } catch (error) {
      console.error('Error fetching navigation items:', error);
      res.status(500).json({ error: 'Failed to fetch navigation items' });
    }
  } else if (req.method === 'POST') {
    try {
      const { path, label, type, order } = req.body;

      const navigationItem = await prisma.navigationItem.create({
        data: {
          path,
          label,
          type,
          order: order || 0,
          isActive: true
        }
      });

      res.status(201).json(navigationItem);
    } catch (error) {
      console.error('Error creating navigation item:', error);
      res.status(500).json({ error: 'Failed to create navigation item' });
    }
  } else if (req.method === 'PUT') {
    try {
      const { id, ...updateData } = req.body;
      
      const navigationItem = await prisma.navigationItem.update({
        where: { id },
        data: updateData
      });

      res.status(200).json(navigationItem);
    } catch (error) {
      console.error('Error updating navigation item:', error);
      res.status(500).json({ error: 'Failed to update navigation item' });
    }
  } else if (req.method === 'DELETE') {
    try {
      const { id } = req.query;
      
      await prisma.navigationItem.update({
        where: { id: id as string },
        data: { isActive: false }
      });

      res.status(200).json({ message: 'Navigation item deleted successfully' });
    } catch (error) {
      console.error('Error deleting navigation item:', error);
      res.status(500).json({ error: 'Failed to delete navigation item' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
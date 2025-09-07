import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const { category } = req.query;
      
      const whereClause = category ? { category: category as string } : {};
      
      const settings = await prisma.siteSettings.findMany({
        where: whereClause,
        orderBy: { key: 'asc' }
      });
      
      res.status(200).json(settings);
    } catch (error) {
      console.error('Error fetching site settings:', error);
      res.status(500).json({ error: 'Failed to fetch site settings' });
    }
  } else if (req.method === 'POST') {
    try {
      const { key, value, type, label, category } = req.body;

      const setting = await prisma.siteSettings.upsert({
        where: { key },
        update: { value, type, label, category },
        create: { key, value, type, label, category }
      });

      res.status(201).json(setting);
    } catch (error) {
      console.error('Error creating/updating site setting:', error);
      res.status(500).json({ error: 'Failed to create/update site setting' });
    }
  } else if (req.method === 'PUT') {
    try {
      const { id, ...updateData } = req.body;
      
      const setting = await prisma.siteSettings.update({
        where: { id },
        data: updateData
      });

      res.status(200).json(setting);
    } catch (error) {
      console.error('Error updating site setting:', error);
      res.status(500).json({ error: 'Failed to update site setting' });
    }
  } else if (req.method === 'DELETE') {
    try {
      const { id } = req.query;
      
      await prisma.siteSettings.delete({
        where: { id: id as string }
      });

      res.status(200).json({ message: 'Site setting deleted successfully' });
    } catch (error) {
      console.error('Error deleting site setting:', error);
      res.status(500).json({ error: 'Failed to delete site setting' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const features = await prisma.feature.findMany({
        where: { isActive: true },
        orderBy: { order: 'asc' }
      });
      
      // Parse JSON fields for response
      const parsedFeatures = features.map(feature => ({
        ...feature,
        benefits: JSON.parse(feature.benefits)
      }));
      
      res.status(200).json(parsedFeatures);
    } catch (error) {
      console.error('Error fetching features:', error);
      res.status(500).json({ error: 'Failed to fetch features' });
    }
  } else if (req.method === 'POST') {
    try {
      const { title, description, icon, benefits, order } = req.body;

      const feature = await prisma.feature.create({
        data: {
          title,
          description,
          icon,
          benefits: JSON.stringify(benefits),
          order: order || 0,
          isActive: true
        }
      });

      // Parse JSON fields for response
      const parsedFeature = {
        ...feature,
        benefits: JSON.parse(feature.benefits)
      };

      res.status(201).json(parsedFeature);
    } catch (error) {
      console.error('Error creating feature:', error);
      res.status(500).json({ error: 'Failed to create feature' });
    }
  } else if (req.method === 'PUT') {
    try {
      const { id, benefits, ...updateData } = req.body;
      
      const feature = await prisma.feature.update({
        where: { id },
        data: {
          ...updateData,
          benefits: benefits ? JSON.stringify(benefits) : undefined
        }
      });

      // Parse JSON fields for response
      const parsedFeature = {
        ...feature,
        benefits: JSON.parse(feature.benefits)
      };

      res.status(200).json(parsedFeature);
    } catch (error) {
      console.error('Error updating feature:', error);
      res.status(500).json({ error: 'Failed to update feature' });
    }
  } else if (req.method === 'DELETE') {
    try {
      const { id } = req.query;
      
      await prisma.feature.update({
        where: { id: id as string },
        data: { isActive: false }
      });

      res.status(200).json({ message: 'Feature deleted successfully' });
    } catch (error) {
      console.error('Error deleting feature:', error);
      res.status(500).json({ error: 'Failed to delete feature' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
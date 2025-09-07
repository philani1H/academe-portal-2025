import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const pricingPlans = await prisma.pricingPlan.findMany({
        where: { isActive: true },
        orderBy: { order: 'asc' }
      });
      
      res.status(200).json(pricingPlans);
    } catch (error) {
      console.error('Error fetching pricing plans:', error);
      res.status(500).json({ error: 'Failed to fetch pricing plans' });
    }
  } else if (req.method === 'POST') {
    try {
      const { name, price, period, features, notIncluded, color, icon, popular, order } = req.body;

      const pricingPlan = await prisma.pricingPlan.create({
        data: {
          name,
          price,
          period,
          features,
          notIncluded,
          color,
          icon,
          popular: popular || false,
          order: order || 0,
          isActive: true
        }
      });

      res.status(201).json(pricingPlan);
    } catch (error) {
      console.error('Error creating pricing plan:', error);
      res.status(500).json({ error: 'Failed to create pricing plan' });
    }
  } else if (req.method === 'PUT') {
    try {
      const { id, ...updateData } = req.body;
      
      const pricingPlan = await prisma.pricingPlan.update({
        where: { id },
        data: updateData
      });

      res.status(200).json(pricingPlan);
    } catch (error) {
      console.error('Error updating pricing plan:', error);
      res.status(500).json({ error: 'Failed to update pricing plan' });
    }
  } else if (req.method === 'DELETE') {
    try {
      const { id } = req.query;
      
      await prisma.pricingPlan.update({
        where: { id: id as string },
        data: { isActive: false }
      });

      res.status(200).json({ message: 'Pricing plan deleted successfully' });
    } catch (error) {
      console.error('Error deleting pricing plan:', error);
      res.status(500).json({ error: 'Failed to delete pricing plan' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
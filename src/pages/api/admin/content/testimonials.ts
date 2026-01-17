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
      const testimonials = await prisma.testimonial.findMany({
        where: { isActive: true },
        orderBy: { order: 'asc' }
      });
      
      res.status(200).json(testimonials);
    } catch (error) {
      console.error('Error fetching testimonials:', error);
      res.status(500).json({ error: 'Failed to fetch testimonials' });
    }
  } else if (req.method === 'POST') {
    try {
      const { content, author, role, subject, improvement, image, rating, order } = req.body;

      const testimonial = await prisma.testimonial.create({
        data: {
          content,
          author,
          role,
          subject,
          improvement,
          image,
          rating: rating || 5,
          order: order || 0,
          isActive: true
        }
      });

      res.status(201).json(testimonial);
    } catch (error) {
      console.error('Error creating testimonial:', error);
      res.status(500).json({ error: 'Failed to create testimonial' });
    }
  } else if (req.method === 'PUT') {
    try {
      const { id, ...updateData } = req.body;
      
      const testimonial = await prisma.testimonial.update({
        where: { id },
        data: updateData
      });

      res.status(200).json(testimonial);
    } catch (error) {
      console.error('Error updating testimonial:', error);
      res.status(500).json({ error: 'Failed to update testimonial' });
    }
  } else if (req.method === 'DELETE') {
    try {
      const { id } = req.query;
      
      await prisma.testimonial.update({
        where: { id: id as string },
        data: { isActive: false }
      });

      res.status(200).json({ message: 'Testimonial deleted successfully' });
    } catch (error) {
      console.error('Error deleting testimonial:', error);
      res.status(500).json({ error: 'Failed to delete testimonial' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
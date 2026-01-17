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
      const tutors = await prisma.tutor.findMany({
        where: { isActive: true },
        orderBy: { order: 'asc' }
      });
      
      // Parse JSON fields for response
      const parsedTutors = tutors.map(tutor => ({
        ...tutor,
        subjects: JSON.parse(tutor.subjects),
        ratings: JSON.parse(tutor.ratings)
      }));
      
      res.status(200).json(parsedTutors);
    } catch (error) {
      console.error('Error fetching tutors:', error);
      res.status(500).json({ error: 'Failed to fetch tutors' });
    }
  } else if (req.method === 'POST') {
    try {
      const { 
        name, 
        subjects, 
        image, 
        contactName, 
        contactPhone, 
        contactEmail, 
        description, 
        ratings, 
        order 
      } = req.body;

      const tutor = await prisma.tutor.create({
        data: {
          name,
          subjects: JSON.stringify(subjects),
          image,
          contactName,
          contactPhone,
          contactEmail,
          description,
          ratings: JSON.stringify(ratings || []),
          order: order || 0,
          isActive: true
        }
      });

      // Parse JSON fields for response
      const parsedTutor = {
        ...tutor,
        subjects: JSON.parse(tutor.subjects),
        ratings: JSON.parse(tutor.ratings)
      };

      res.status(201).json(parsedTutor);
    } catch (error) {
      console.error('Error creating tutor:', error);
      res.status(500).json({ error: 'Failed to create tutor' });
    }
  } else if (req.method === 'PUT') {
    try {
      const { id, subjects, ratings, ...updateData } = req.body;
      
      const tutor = await prisma.tutor.update({
        where: { id },
        data: {
          ...updateData,
          subjects: subjects ? JSON.stringify(subjects) : undefined,
          ratings: ratings ? JSON.stringify(ratings) : undefined
        }
      });

      // Parse JSON fields for response
      const parsedTutor = {
        ...tutor,
        subjects: JSON.parse(tutor.subjects),
        ratings: JSON.parse(tutor.ratings)
      };

      res.status(200).json(parsedTutor);
    } catch (error) {
      console.error('Error updating tutor:', error);
      res.status(500).json({ error: 'Failed to update tutor' });
    }
  } else if (req.method === 'DELETE') {
    try {
      const { id } = req.query;
      
      await prisma.tutor.update({
        where: { id: id as string },
        data: { isActive: false }
      });

      res.status(200).json({ message: 'Tutor deleted successfully' });
    } catch (error) {
      console.error('Error deleting tutor:', error);
      res.status(500).json({ error: 'Failed to delete tutor' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
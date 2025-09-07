import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const subjects = await prisma.subject.findMany({
        where: { isActive: true },
        orderBy: { order: 'asc' }
      });
      
      // Parse JSON fields for response
      const parsedSubjects = subjects.map(subject => ({
        ...subject,
        popularTopics: JSON.parse(subject.popularTopics),
        difficulty: JSON.parse(subject.difficulty)
      }));
      
      res.status(200).json(parsedSubjects);
    } catch (error) {
      console.error('Error fetching subjects:', error);
      res.status(500).json({ error: 'Failed to fetch subjects' });
    }
  } else if (req.method === 'POST') {
    try {
      const { 
        name, 
        description, 
        image, 
        category, 
        tutorsCount, 
        popularTopics, 
        difficulty, 
        order 
      } = req.body;

      const subject = await prisma.subject.create({
        data: {
          name,
          description,
          image,
          category,
          tutorsCount: tutorsCount || 0,
          popularTopics: JSON.stringify(popularTopics || []),
          difficulty: JSON.stringify(difficulty || []),
          order: order || 0,
          isActive: true
        }
      });

      // Parse JSON fields for response
      const parsedSubject = {
        ...subject,
        popularTopics: JSON.parse(subject.popularTopics),
        difficulty: JSON.parse(subject.difficulty)
      };

      res.status(201).json(parsedSubject);
    } catch (error) {
      console.error('Error creating subject:', error);
      res.status(500).json({ error: 'Failed to create subject' });
    }
  } else if (req.method === 'PUT') {
    try {
      const { id, popularTopics, difficulty, ...updateData } = req.body;
      
      const subject = await prisma.subject.update({
        where: { id },
        data: {
          ...updateData,
          popularTopics: popularTopics ? JSON.stringify(popularTopics) : undefined,
          difficulty: difficulty ? JSON.stringify(difficulty) : undefined
        }
      });

      // Parse JSON fields for response
      const parsedSubject = {
        ...subject,
        popularTopics: JSON.parse(subject.popularTopics),
        difficulty: JSON.parse(subject.difficulty)
      };

      res.status(200).json(parsedSubject);
    } catch (error) {
      console.error('Error updating subject:', error);
      res.status(500).json({ error: 'Failed to update subject' });
    }
  } else if (req.method === 'DELETE') {
    try {
      const { id } = req.query;
      
      await prisma.subject.update({
        where: { id: id as string },
        data: { isActive: false }
      });

      res.status(200).json({ message: 'Subject deleted successfully' });
    } catch (error) {
      console.error('Error deleting subject:', error);
      res.status(500).json({ error: 'Failed to delete subject' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
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
      const heroContent = await prisma.heroContent.findFirst({
        where: { isActive: true },
        orderBy: { createdAt: 'desc' }
      });
      
      if (!heroContent) {
        return res.status(404).json({ error: 'No hero content found' });
      }
      
      // Parse JSON fields for response
      const parsedHeroContent = {
        ...heroContent,
        universities: JSON.parse(heroContent.universities),
        features: JSON.parse(heroContent.features)
      };
      
      res.status(200).json(parsedHeroContent);
    } catch (error) {
      console.error('Error fetching hero content:', error);
      res.status(500).json({ error: 'Failed to fetch hero content' });
    }
  } else if (req.method === 'POST') {
    try {
      const {
        title,
        subtitle,
        description,
        buttonText,
        secondaryButtonText,
        trustIndicatorText,
        universities,
        features,
        backgroundGradient
      } = req.body;

      // Deactivate existing hero content
      await prisma.heroContent.updateMany({
        where: { isActive: true },
        data: { isActive: false }
      });

      const heroContent = await prisma.heroContent.create({
        data: {
          title,
          subtitle,
          description,
          buttonText,
          secondaryButtonText,
          trustIndicatorText,
          universities: JSON.stringify(universities),
          features: JSON.stringify(features),
          backgroundGradient,
          isActive: true
        }
      });

      // Parse JSON fields for response
      const parsedHeroContent = {
        ...heroContent,
        universities: JSON.parse(heroContent.universities),
        features: JSON.parse(heroContent.features)
      };

      res.status(201).json(parsedHeroContent);
    } catch (error) {
      console.error('Error creating hero content:', error);
      res.status(500).json({ error: 'Failed to create hero content' });
    }
  } else if (req.method === 'PUT') {
    try {
      const { id, universities, features, ...updateData } = req.body;
      
      const heroContent = await prisma.heroContent.update({
        where: { id },
        data: {
          ...updateData,
          universities: universities ? JSON.stringify(universities) : undefined,
          features: features ? JSON.stringify(features) : undefined
        }
      });

      // Parse JSON fields for response
      const parsedHeroContent = {
        ...heroContent,
        universities: JSON.parse(heroContent.universities),
        features: JSON.parse(heroContent.features)
      };

      res.status(200).json(parsedHeroContent);
    } catch (error) {
      console.error('Error updating hero content:', error);
      res.status(500).json({ error: 'Failed to update hero content' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST', 'PUT']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
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

  try {
    switch (req.method) {
      case 'GET':
        return await getBecomeTutorContent(req, res);
      case 'POST':
        return await createBecomeTutorContent(req, res);
      case 'PUT':
        return await updateBecomeTutorContent(req, res);
      case 'DELETE':
        return await deleteBecomeTutorContent(req, res);
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Become tutor content API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function getBecomeTutorContent(req: NextApiRequest, res: NextApiResponse) {
  try {
    const content = await prisma.becomeTutorContent.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' }
    });

    if (!content) {
      return res.status(404).json({ error: 'Become tutor content not found' });
    }

    // Parse JSON fields
    const parsedContent = {
      ...content,
      requirements: JSON.parse(content.requirements || '[]'),
      benefits: JSON.parse(content.benefits || '[]')
    };

    return res.status(200).json(parsedContent);
  } catch (error) {
    console.error('Error fetching become tutor content:', error);
    return res.status(500).json({ error: 'Failed to fetch become tutor content' });
  }
}

async function createBecomeTutorContent(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { title, description, requirements, benefits, applicationUrl, formEmbedCode } = req.body;

    const content = await prisma.becomeTutorContent.create({
      data: {
        title,
        description,
        requirements: JSON.stringify(requirements || []),
        benefits: JSON.stringify(benefits || []),
        applicationUrl,
        formEmbedCode
      }
    });

    // Parse JSON fields for response
    const parsedContent = {
      ...content,
      requirements: JSON.parse(content.requirements || '[]'),
      benefits: JSON.parse(content.benefits || '[]')
    };

    return res.status(201).json(parsedContent);
  } catch (error) {
    console.error('Error creating become tutor content:', error);
    return res.status(500).json({ error: 'Failed to create become tutor content' });
  }
}

async function updateBecomeTutorContent(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { id, title, description, requirements, benefits, applicationUrl, formEmbedCode } = req.body;

    if (!id) {
      return res.status(400).json({ error: 'ID is required for update' });
    }

    const content = await prisma.becomeTutorContent.update({
      where: { id },
      data: {
        title,
        description,
        requirements: JSON.stringify(requirements || []),
        benefits: JSON.stringify(benefits || []),
        applicationUrl,
        formEmbedCode
      }
    });

    // Parse JSON fields for response
    const parsedContent = {
      ...content,
      requirements: JSON.parse(content.requirements || '[]'),
      benefits: JSON.parse(content.benefits || '[]')
    };

    return res.status(200).json(parsedContent);
  } catch (error) {
    console.error('Error updating become tutor content:', error);
    return res.status(500).json({ error: 'Failed to update become tutor content' });
  }
}

async function deleteBecomeTutorContent(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { id } = req.query;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Valid ID is required' });
    }

    await prisma.becomeTutorContent.delete({
      where: { id }
    });

    return res.status(200).json({ message: 'Become tutor content deleted successfully' });
  } catch (error) {
    console.error('Error deleting become tutor content:', error);
    return res.status(500).json({ error: 'Failed to delete become tutor content' });
  }
}
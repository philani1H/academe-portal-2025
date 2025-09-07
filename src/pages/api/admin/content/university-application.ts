import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    switch (req.method) {
      case 'GET':
        return await getUniversityApplicationContent(req, res);
      case 'POST':
        return await createUniversityApplicationContent(req, res);
      case 'PUT':
        return await updateUniversityApplicationContent(req, res);
      case 'DELETE':
        return await deleteUniversityApplicationContent(req, res);
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('University application content API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function getUniversityApplicationContent(req: NextApiRequest, res: NextApiResponse) {
  try {
    const content = await prisma.universityApplicationContent.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' }
    });

    if (!content) {
      return res.status(404).json({ error: 'University application content not found' });
    }

    // Parse JSON fields
    const parsedContent = {
      ...content,
      services: JSON.parse(content.services || '[]'),
      process: JSON.parse(content.process || '[]'),
      requirements: JSON.parse(content.requirements || '[]'),
      pricing: JSON.parse(content.pricing || '{}')
    };

    return res.status(200).json(parsedContent);
  } catch (error) {
    console.error('Error fetching university application content:', error);
    return res.status(500).json({ error: 'Failed to fetch university application content' });
  }
}

async function createUniversityApplicationContent(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { title, description, services, process, requirements, pricing, formUrl } = req.body;

    const content = await prisma.universityApplicationContent.create({
      data: {
        title,
        description,
        services: JSON.stringify(services || []),
        process: JSON.stringify(process || []),
        requirements: JSON.stringify(requirements || []),
        pricing: JSON.stringify(pricing || {}),
        formUrl
      }
    });

    // Parse JSON fields for response
    const parsedContent = {
      ...content,
      services: JSON.parse(content.services || '[]'),
      process: JSON.parse(content.process || '[]'),
      requirements: JSON.parse(content.requirements || '[]'),
      pricing: JSON.parse(content.pricing || '{}')
    };

    return res.status(201).json(parsedContent);
  } catch (error) {
    console.error('Error creating university application content:', error);
    return res.status(500).json({ error: 'Failed to create university application content' });
  }
}

async function updateUniversityApplicationContent(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { id, title, description, services, process, requirements, pricing, formUrl } = req.body;

    if (!id) {
      return res.status(400).json({ error: 'ID is required for update' });
    }

    const content = await prisma.universityApplicationContent.update({
      where: { id },
      data: {
        title,
        description,
        services: JSON.stringify(services || []),
        process: JSON.stringify(process || []),
        requirements: JSON.stringify(requirements || []),
        pricing: JSON.stringify(pricing || {}),
        formUrl
      }
    });

    // Parse JSON fields for response
    const parsedContent = {
      ...content,
      services: JSON.parse(content.services || '[]'),
      process: JSON.parse(content.process || '[]'),
      requirements: JSON.parse(content.requirements || '[]'),
      pricing: JSON.parse(content.pricing || '{}')
    };

    return res.status(200).json(parsedContent);
  } catch (error) {
    console.error('Error updating university application content:', error);
    return res.status(500).json({ error: 'Failed to update university application content' });
  }
}

async function deleteUniversityApplicationContent(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { id } = req.query;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Valid ID is required' });
    }

    await prisma.universityApplicationContent.delete({
      where: { id }
    });

    return res.status(200).json({ message: 'University application content deleted successfully' });
  } catch (error) {
    console.error('Error deleting university application content:', error);
    return res.status(500).json({ error: 'Failed to delete university application content' });
  }
}
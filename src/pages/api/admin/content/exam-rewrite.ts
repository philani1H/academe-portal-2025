import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    switch (req.method) {
      case 'GET':
        return await getExamRewriteContent(req, res);
      case 'POST':
        return await createExamRewriteContent(req, res);
      case 'PUT':
        return await updateExamRewriteContent(req, res);
      case 'DELETE':
        return await deleteExamRewriteContent(req, res);
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Exam rewrite content API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function getExamRewriteContent(req: NextApiRequest, res: NextApiResponse) {
  try {
    const content = await prisma.examRewriteContent.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' }
    });

    if (!content) {
      return res.status(404).json({ error: 'Exam rewrite content not found' });
    }

    // Parse JSON fields
    const parsedContent = {
      ...content,
      benefits: JSON.parse(content.benefits || '[]'),
      process: JSON.parse(content.process || '[]'),
      subjects: JSON.parse(content.subjects || '[]'),
      pricingInfo: JSON.parse(content.pricingInfo || '{}')
    };

    return res.status(200).json(parsedContent);
  } catch (error) {
    console.error('Error fetching exam rewrite content:', error);
    return res.status(500).json({ error: 'Failed to fetch exam rewrite content' });
  }
}

async function createExamRewriteContent(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { 
      title, 
      description, 
      heroTitle, 
      heroDescription, 
      benefits, 
      process, 
      subjects, 
      applicationFormUrl, 
      grade11FormUrl, 
      grade12FormUrl, 
      pricingInfo 
    } = req.body;

    const content = await prisma.examRewriteContent.create({
      data: {
        title,
        description,
        heroTitle,
        heroDescription,
        benefits: JSON.stringify(benefits || []),
        process: JSON.stringify(process || []),
        subjects: JSON.stringify(subjects || []),
        applicationFormUrl,
        grade11FormUrl,
        grade12FormUrl,
        pricingInfo: JSON.stringify(pricingInfo || {})
      }
    });

    // Parse JSON fields for response
    const parsedContent = {
      ...content,
      benefits: JSON.parse(content.benefits || '[]'),
      process: JSON.parse(content.process || '[]'),
      subjects: JSON.parse(content.subjects || '[]'),
      pricingInfo: JSON.parse(content.pricingInfo || '{}')
    };

    return res.status(201).json(parsedContent);
  } catch (error) {
    console.error('Error creating exam rewrite content:', error);
    return res.status(500).json({ error: 'Failed to create exam rewrite content' });
  }
}

async function updateExamRewriteContent(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { 
      id, 
      title, 
      description, 
      heroTitle, 
      heroDescription, 
      benefits, 
      process, 
      subjects, 
      applicationFormUrl, 
      grade11FormUrl, 
      grade12FormUrl, 
      pricingInfo 
    } = req.body;

    if (!id) {
      return res.status(400).json({ error: 'ID is required for update' });
    }

    const content = await prisma.examRewriteContent.update({
      where: { id },
      data: {
        title,
        description,
        heroTitle,
        heroDescription,
        benefits: JSON.stringify(benefits || []),
        process: JSON.stringify(process || []),
        subjects: JSON.stringify(subjects || []),
        applicationFormUrl,
        grade11FormUrl,
        grade12FormUrl,
        pricingInfo: JSON.stringify(pricingInfo || {})
      }
    });

    // Parse JSON fields for response
    const parsedContent = {
      ...content,
      benefits: JSON.parse(content.benefits || '[]'),
      process: JSON.parse(content.process || '[]'),
      subjects: JSON.parse(content.subjects || '[]'),
      pricingInfo: JSON.parse(content.pricingInfo || '{}')
    };

    return res.status(200).json(parsedContent);
  } catch (error) {
    console.error('Error updating exam rewrite content:', error);
    return res.status(500).json({ error: 'Failed to update exam rewrite content' });
  }
}

async function deleteExamRewriteContent(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { id } = req.query;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Valid ID is required' });
    }

    await prisma.examRewriteContent.delete({
      where: { id }
    });

    return res.status(200).json({ message: 'Exam rewrite content deleted successfully' });
  } catch (error) {
    console.error('Error deleting exam rewrite content:', error);
    return res.status(500).json({ error: 'Failed to delete exam rewrite content' });
  }
}
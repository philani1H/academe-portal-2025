import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    switch (req.method) {
      case 'GET':
        return await getTests(req, res);
      case 'POST':
        return await createTest(req, res);
      case 'PUT':
        return await updateTest(req, res);
      case 'DELETE':
        return await deleteTest(req, res);
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Tests API error:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch tests',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

async function getTests(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { courseId, tutorId } = req.query;

    const where: any = {};
    if (courseId) {
      where.courseId = parseInt(courseId as string);
    }

    const tests = await prisma.test.findMany({
      where,
      include: {
        course: true,
        questions: true,
        submissions: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return res.status(200).json({ success: true, tests });
  } catch (error) {
    console.error('Error fetching tests:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch tests' });
  }
}

async function createTest(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { title, courseId, questions } = req.body;

    if (!title || !courseId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const test = await prisma.test.create({
      data: {
        title,
        courseId: parseInt(courseId),
        questions: {
          create: questions || []
        }
      },
      include: {
        questions: true
      }
    });

    return res.status(201).json({ success: true, test });
  } catch (error) {
    console.error('Error creating test:', error);
    return res.status(500).json({ success: false, error: 'Failed to create test' });
  }
}

async function updateTest(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { id, title, questions } = req.body;

    if (!id) {
      return res.status(400).json({ error: 'Test ID required' });
    }

    const test = await prisma.test.update({
      where: { id },
      data: {
        ...(title && { title }),
      },
      include: {
        questions: true
      }
    });

    return res.status(200).json({ success: true, test });
  } catch (error) {
    console.error('Error updating test:', error);
    return res.status(500).json({ success: false, error: 'Failed to update test' });
  }
}

async function deleteTest(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { id } = req.query;

    if (!id) {
      return res.status(400).json({ error: 'Test ID required' });
    }

    // Delete questions first
    await prisma.testQuestion.deleteMany({
      where: { testId: id as string }
    });

    // Delete test
    await prisma.test.delete({
      where: { id: id as string }
    });

    return res.status(200).json({ success: true, message: 'Test deleted successfully' });
  } catch (error) {
    console.error('Error deleting test:', error);
    return res.status(500).json({ success: false, error: 'Failed to delete test' });
  }
}

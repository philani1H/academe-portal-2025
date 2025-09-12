import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    switch (req.method) {
      case 'GET':
        return await getCourses(req, res);
      case 'POST':
        return await createCourse(req, res);
      case 'PUT':
        return await updateCourse(req, res);
      case 'DELETE':
        return await deleteCourse(req, res);
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Courses API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function getCourses(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { status, department, tutorId, page = 1, limit = 10 } = req.query;
    
    const where: any = {};
    if (status) where.status = status;
    if (department) where.department = department;
    if (tutorId) where.tutorId = tutorId;

    const courses = await prisma.course.findMany({
      where,
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
      orderBy: { createdAt: 'desc' },
      include: {
        tutor: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        enrollments: {
          select: {
            id: true,
            userId: true
          }
        }
      }
    });

    const total = await prisma.course.count({ where });

    // Format courses with student count
    const formattedCourses = courses.map(course => ({
      ...course,
      students: course.enrollments.length,
      tutor: course.tutor
    }));

    return res.status(200).json({
      courses: formattedCourses,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching courses:', error);
    return res.status(500).json({ error: 'Failed to fetch courses' });
  }
}

async function createCourse(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { name, description, department, tutorId, startDate, endDate, color } = req.body;

    if (!name || !description || !department || !tutorId) {
      return res.status(400).json({ error: 'Name, description, department, and tutorId are required' });
    }

    const course = await prisma.course.create({
      data: {
        title: name,
        description,
        department,
        tutorId,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        color: color || '#4f46e5',
        status: 'active'
      }
    });

    return res.status(201).json(course);
  } catch (error) {
    console.error('Error creating course:', error);
    return res.status(500).json({ error: 'Failed to create course' });
  }
}

async function updateCourse(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { id } = req.query;
    const updateData = req.body;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Course ID is required' });
    }

    // Handle date fields
    if (updateData.startDate) {
      updateData.startDate = new Date(updateData.startDate);
    }
    if (updateData.endDate) {
      updateData.endDate = new Date(updateData.endDate);
    }

    const course = await prisma.course.update({
      where: { id },
      data: updateData
    });

    return res.status(200).json(course);
  } catch (error) {
    console.error('Error updating course:', error);
    return res.status(500).json({ error: 'Failed to update course' });
  }
}

async function deleteCourse(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { id } = req.query;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Course ID is required' });
    }

    await prisma.course.delete({
      where: { id }
    });

    return res.status(200).json({ message: 'Course deleted successfully' });
  } catch (error) {
    console.error('Error deleting course:', error);
    return res.status(500).json({ error: 'Failed to delete course' });
  }
}
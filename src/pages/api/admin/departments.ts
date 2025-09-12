import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    switch (req.method) {
      case 'GET':
        return await getDepartments(req, res);
      case 'POST':
        return await createDepartment(req, res);
      case 'PUT':
        return await updateDepartment(req, res);
      case 'DELETE':
        return await deleteDepartment(req, res);
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Departments API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function getDepartments(req: NextApiRequest, res: NextApiResponse) {
  try {
    const departments = await prisma.department.findMany({
      include: {
        courses: {
          select: {
            id: true
          }
        },
        tutors: {
          select: {
            id: true
          }
        },
        students: {
          select: {
            id: true
          }
        }
      }
    });

    // Format departments with counts
    const formattedDepartments = departments.map(dept => ({
      id: dept.id,
      name: dept.name,
      color: dept.color,
      courses: dept.courses.length,
      tutors: dept.tutors.length,
      students: dept.students.length
    }));

    return res.status(200).json(formattedDepartments);
  } catch (error) {
    console.error('Error fetching departments:', error);
    return res.status(500).json({ error: 'Failed to fetch departments' });
  }
}

async function createDepartment(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { name, color } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Department name is required' });
    }

    const department = await prisma.department.create({
      data: {
        name,
        color: color || '#4f46e5'
      }
    });

    return res.status(201).json(department);
  } catch (error) {
    console.error('Error creating department:', error);
    return res.status(500).json({ error: 'Failed to create department' });
  }
}

async function updateDepartment(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { id } = req.query;
    const updateData = req.body;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Department ID is required' });
    }

    const department = await prisma.department.update({
      where: { id },
      data: updateData
    });

    return res.status(200).json(department);
  } catch (error) {
    console.error('Error updating department:', error);
    return res.status(500).json({ error: 'Failed to update department' });
  }
}

async function deleteDepartment(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { id } = req.query;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Department ID is required' });
    }

    await prisma.department.delete({
      where: { id }
    });

    return res.status(200).json({ message: 'Department deleted successfully' });
  } catch (error) {
    console.error('Error deleting department:', error);
    return res.status(500).json({ error: 'Failed to delete department' });
  }
}
import type { NextApiRequest, NextApiResponse } from 'next'
import prisma from '@/lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    switch (req.method) {
      case 'GET':
        return await getCourses(req, res)
      case 'POST':
        return await createCourse(req, res)
      case 'PUT':
        return await updateCourse(req, res)
      case 'DELETE':
        return await deleteCourse(req, res)
      default:
        return res.status(405).json({ error: 'Method not allowed' })
    }
  } catch (error) {
    console.error('Courses API error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

async function getCourses(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { all, tutorId } = req.query

    let where = {}
    if (tutorId && typeof tutorId === 'string') {
      where = { tutorId: parseInt(tutorId) }
    }

    const courses = await prisma.course.findMany({
      where,
      include: {
        tutor: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        courseEnrollments: true,
        materials: true,
        tests: true
      },
      orderBy: { createdAt: 'desc' }
    })

    const formattedCourses = courses.map((course) => ({
      id: course.id,
      ID: course.id,
      name: course.name,
      title: course.name,
      description: course.description,
      category: course.category,
      department: course.department,
      tutorId: course.tutorId,
      tutor_id: course.tutorId,
      tutor: course.tutor,
      status: 'active', // Default status
      students: course.courseEnrollments.length,
      createdAt: course.createdAt,
      created_at: course.createdAt,
      updatedAt: course.updatedAt,
      materialsCount: course.materials.length,
      testsCount: course.tests.length
    }))

    return res.status(200).json(formattedCourses)
  } catch (error) {
    console.error('Error fetching courses:', error)
    return res.status(500).json({ error: 'Failed to fetch courses' })
  }
}

async function createCourse(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { title, description, department, tutorId, startDate, endDate, category, section } = req.body

    if (!title || !department) {
      return res.status(400).json({ error: 'Title and department are required' })
    }

    // Convert tutorId to integer if it's a string
    let parsedTutorId: number | null = null
    if (tutorId) {
      const parsed = parseInt(String(tutorId))
      if (!isNaN(parsed)) {
        parsedTutorId = parsed
      }
    }

    const course = await prisma.course.create({
      data: {
        name: title,
        description: description || null,
        category: category || department,
        department: department || category,
        tutorId: parsedTutorId
      },
      include: {
        tutor: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    return res.status(201).json({
      id: course.id,
      name: course.name,
      title: course.name,
      description: course.description,
      category: course.category,
      department: course.department,
      tutorId: course.tutorId,
      tutor: course.tutor,
      createdAt: course.createdAt
    })
  } catch (error) {
    console.error('Error creating course:', error)
    return res.status(500).json({ error: 'Failed to create course' })
  }
}

async function updateCourse(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { id, courseId, title, name, description, category, department, tutorId, status } = req.body

    const cId = id || courseId
    if (!cId) {
      return res.status(400).json({ error: 'Course ID is required' })
    }

    // Convert tutorId to integer if provided
    let parsedTutorId: number | null | undefined = undefined
    if (tutorId !== undefined) {
      if (tutorId === '' || tutorId === null) {
        parsedTutorId = null
      } else {
        const parsed = parseInt(String(tutorId))
        if (!isNaN(parsed)) {
          parsedTutorId = parsed
        }
      }
    }

    const updateData: any = {}
    if (title !== undefined) updateData.name = title
    if (name !== undefined) updateData.name = name
    if (description !== undefined) updateData.description = description
    if (category !== undefined) updateData.category = category
    if (department !== undefined) updateData.department = department
    if (parsedTutorId !== undefined) updateData.tutorId = parsedTutorId

    const course = await prisma.course.update({
      where: { id: parseInt(String(cId)) },
      data: updateData,
      include: {
        tutor: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    return res.status(200).json({
      id: course.id,
      name: course.name,
      title: course.name,
      description: course.description,
      category: course.category,
      department: course.department,
      tutorId: course.tutorId,
      tutor: course.tutor,
      updatedAt: course.updatedAt
    })
  } catch (error) {
    console.error('Error updating course:', error)
    return res.status(500).json({ error: 'Failed to update course' })
  }
}

async function deleteCourse(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { id } = req.query

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Course ID is required' })
    }

    await prisma.course.delete({
      where: { id: parseInt(id) }
    })

    return res.status(200).json({ success: true })
  } catch (error) {
    console.error('Error deleting course:', error)
    return res.status(500).json({ error: 'Failed to delete course' })
  }
}

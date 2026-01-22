import type { NextApiRequest, NextApiResponse } from 'next'
import prisma from '@/lib/prisma'
import jwt from 'jsonwebtoken'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    switch (req.method) {
      case 'POST':
        return await uploadMaterial(req, res)
      case 'DELETE':
        return await deleteMaterial(req, res)
      default:
        return res.status(405).json({ error: 'Method not allowed' })
    }
  } catch (error) {
    console.error('Tutor materials API error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

async function uploadMaterial(req: NextApiRequest, res: NextApiResponse) {
  try {
    const token = req.headers.authorization?.split(' ')[1]
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: number; role: string }
    if (decoded.role !== 'tutor') {
      return res.status(403).json({ error: 'Forbidden' })
    }

    const { courseId, title, description, type, url, size } = req.body

    if (!courseId || !title || !type || !url) {
      return res.status(400).json({ error: 'Course ID, title, type, and URL are required' })
    }

    // Verify course exists and belongs to tutor
    const course = await prisma.course.findUnique({
      where: { id: parseInt(courseId) }
    })

    if (!course) {
      return res.status(404).json({ error: 'Course not found' })
    }

    if (course.tutorId !== decoded.userId) {
      return res.status(403).json({ error: 'Access denied: You can only upload materials to your own courses' })
    }

    // Get the highest order number for this course
    const maxOrderMaterial = await prisma.courseMaterial.findFirst({
      where: { courseId: parseInt(courseId) },
      orderBy: { order: 'desc' },
    })

    const newOrder = maxOrderMaterial ? maxOrderMaterial.order + 1 : 0

    const material = await prisma.courseMaterial.create({
      data: {
        courseId: parseInt(courseId),
        title,
        description: description || '',
        type,
        url,
        size: size || '',
        order: newOrder,
      },
    })

    const io = (global as any).io
    if (io) {
      io.emit('material-added', { courseId, material })
    }

    return res.status(201).json({
      message: 'Material uploaded successfully',
      material: {
        id: material.id,
        title: material.title,
        description: material.description,
        type: material.type,
        url: material.url,
        size: material.size,
        order: material.order,
        createdAt: material.createdAt.toISOString(),
      },
    })
  } catch (error) {
    console.error('Error uploading material:', error)
    return res.status(500).json({ error: 'Failed to upload material' })
  }
}

async function deleteMaterial(req: NextApiRequest, res: NextApiResponse) {
  try {
    const token = req.headers.authorization?.split(' ')[1]
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: number; role: string }
    if (decoded.role !== 'tutor') {
      return res.status(403).json({ error: 'Forbidden' })
    }

    const { materialId } = req.query

    if (!materialId || typeof materialId !== 'string') {
      return res.status(400).json({ error: 'Material ID is required' })
    }

    const material = await prisma.courseMaterial.findUnique({
      where: { id: materialId },
      include: { course: true }
    })

    if (!material) {
      return res.status(404).json({ error: 'Material not found' })
    }

    if (material.course.tutorId !== decoded.userId) {
      return res.status(403).json({ error: 'Access denied: You can only delete materials from your own courses' })
    }

    await prisma.courseMaterial.delete({
      where: { id: materialId }
    })

    return res.status(200).json({ message: 'Material deleted successfully' })
  } catch (error) {
    console.error('Error deleting material:', error)
    return res.status(500).json({ error: 'Failed to delete material' })
  }
}


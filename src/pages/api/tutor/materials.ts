import type { NextApiRequest, NextApiResponse } from 'next'
import prisma from '@/lib/prisma'

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
    const { courseId, title, description, type, url, size } = req.body

    if (!courseId || !title || !type || !url) {
      return res.status(400).json({ error: 'Course ID, title, type, and URL are required' })
    }

    // Get the highest order number for this course
    const maxOrderMaterial = await prisma.courseMaterial.findFirst({
      where: { courseId },
      orderBy: { order: 'desc' },
    })

    const newOrder = maxOrderMaterial ? maxOrderMaterial.order + 1 : 0

    const material = await prisma.courseMaterial.create({
      data: {
        courseId,
        title,
        description: description || '',
        type,
        url,
        size: size || '',
        order: newOrder,
      },
    })

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
    const { materialId } = req.query

    if (!materialId || typeof materialId !== 'string') {
      return res.status(400).json({ error: 'Material ID is required' })
    }

    await prisma.courseMaterial.delete({
      where: { id: materialId },
    })

    return res.status(200).json({
      message: 'Material deleted successfully',
    })
  } catch (error) {
    console.error('Error deleting material:', error)
    return res.status(500).json({ error: 'Failed to delete material' })
  }
}

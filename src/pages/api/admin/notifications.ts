import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    switch (req.method) {
      case 'GET':
        return await getNotifications(req, res);
      case 'POST':
        return await createNotification(req, res);
      case 'PUT':
        return await updateNotification(req, res);
      case 'DELETE':
        return await deleteNotification(req, res);
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Notifications API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function getNotifications(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { type, status, page = 1, limit = 10 } = req.query;
    
    const where: any = {};
    if (type) where.type = type;
    if (status) where.status = status;

    const notifications = await prisma.notification.findMany({
      where,
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
      orderBy: { createdAt: 'desc' }
    });

    const total = await prisma.notification.count({ where });

    return res.status(200).json({
      notifications,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return res.status(500).json({ error: 'Failed to fetch notifications' });
  }
}

async function createNotification(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { title, message, type, recipients } = req.body;

    if (!title || !message || !type) {
      return res.status(400).json({ error: 'Title, message, and type are required' });
    }

    const notification = await prisma.notification.create({
      data: {
        title,
        message,
        type,
        recipients: recipients || {},
        status: 'sent',
        read: false
      }
    });

    return res.status(201).json(notification);
  } catch (error) {
    console.error('Error creating notification:', error);
    return res.status(500).json({ error: 'Failed to create notification' });
  }
}

async function updateNotification(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { id } = req.query;
    const updateData = req.body;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Notification ID is required' });
    }

    const notification = await prisma.notification.update({
      where: { id },
      data: updateData
    });

    return res.status(200).json(notification);
  } catch (error) {
    console.error('Error updating notification:', error);
    return res.status(500).json({ error: 'Failed to update notification' });
  }
}

async function deleteNotification(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { id } = req.query;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Notification ID is required' });
    }

    await prisma.notification.delete({
      where: { id }
    });

    return res.status(200).json({ message: 'Notification deleted successfully' });
  } catch (error) {
    console.error('Error deleting notification:', error);
    return res.status(500).json({ error: 'Failed to delete notification' });
  }
}
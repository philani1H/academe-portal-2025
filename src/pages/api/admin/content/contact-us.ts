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

  if (req.method === 'GET') {
    try {
      const contactUsContent = await prisma.contactUsContent.findFirst({
        where: { isActive: true },
        orderBy: { createdAt: 'desc' }
      });
      
      if (!contactUsContent) {
        return res.status(404).json({ error: 'No contact us content found' });
      }
      
      // Parse JSON fields for response
      const parsedContactUsContent = {
        ...contactUsContent,
        contactInfo: JSON.parse(contactUsContent.contactInfo)
      };
      
      res.status(200).json(parsedContactUsContent);
    } catch (error) {
      console.error('Error fetching contact us content:', error);
      res.status(500).json({ error: 'Failed to fetch contact us content' });
    }
  } else if (req.method === 'POST') {
    try {
      const {
        title,
        description,
        logo,
        formEndpoint,
        contactInfo
      } = req.body;

      // Deactivate existing contact us content
      await prisma.contactUsContent.updateMany({
        where: { isActive: true },
        data: { isActive: false }
      });

      const contactUsContent = await prisma.contactUsContent.create({
        data: {
          title,
          description,
          logo,
          formEndpoint,
          contactInfo: JSON.stringify(contactInfo),
          isActive: true
        }
      });

      // Parse JSON fields for response
      const parsedContactUsContent = {
        ...contactUsContent,
        contactInfo: JSON.parse(contactUsContent.contactInfo)
      };

      res.status(201).json(parsedContactUsContent);
    } catch (error) {
      console.error('Error creating contact us content:', error);
      res.status(500).json({ error: 'Failed to create contact us content' });
    }
  } else if (req.method === 'PUT') {
    try {
      const { id, contactInfo, ...updateData } = req.body;
      
      const contactUsContent = await prisma.contactUsContent.update({
        where: { id },
        data: {
          ...updateData,
          contactInfo: contactInfo ? JSON.stringify(contactInfo) : undefined
        }
      });

      // Parse JSON fields for response
      const parsedContactUsContent = {
        ...contactUsContent,
        contactInfo: JSON.parse(contactUsContent.contactInfo)
      };

      res.status(200).json(parsedContactUsContent);
    } catch (error) {
      console.error('Error updating contact us content:', error);
      res.status(500).json({ error: 'Failed to update contact us content' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST', 'PUT']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
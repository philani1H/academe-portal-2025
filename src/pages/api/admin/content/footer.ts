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
      const footerContent = await prisma.footerContent.findFirst({
        where: { isActive: true },
        orderBy: { createdAt: 'desc' }
      });
      
      if (!footerContent) {
        return res.status(404).json({ error: 'No footer content found' });
      }
      
      // Parse JSON fields for response
      const parsedFooterContent = {
        ...footerContent,
        socialLinks: JSON.parse(footerContent.socialLinks),
        quickLinks: JSON.parse(footerContent.quickLinks),
        resourceLinks: JSON.parse(footerContent.resourceLinks)
      };
      
      res.status(200).json(parsedFooterContent);
    } catch (error) {
      console.error('Error fetching footer content:', error);
      res.status(500).json({ error: 'Failed to fetch footer content' });
    }
  } else if (req.method === 'POST') {
    try {
      const {
        companyName,
        tagline,
        contactPhone,
        contactEmail,
        contactPerson,
        whatsappLink,
        socialLinks,
        quickLinks,
        resourceLinks,
        copyrightText
      } = req.body;

      // Deactivate existing footer content
      await prisma.footerContent.updateMany({
        where: { isActive: true },
        data: { isActive: false }
      });

      const footerContent = await prisma.footerContent.create({
        data: {
          companyName,
          tagline,
          contactPhone,
          contactEmail,
          contactPerson,
          whatsappLink,
          socialLinks: JSON.stringify(socialLinks),
          quickLinks: JSON.stringify(quickLinks),
          resourceLinks: JSON.stringify(resourceLinks),
          copyrightText,
          isActive: true
        }
      });

      // Parse JSON fields for response
      const parsedFooterContent = {
        ...footerContent,
        socialLinks: JSON.parse(footerContent.socialLinks),
        quickLinks: JSON.parse(footerContent.quickLinks),
        resourceLinks: JSON.parse(footerContent.resourceLinks)
      };

      res.status(201).json(parsedFooterContent);
    } catch (error) {
      console.error('Error creating footer content:', error);
      res.status(500).json({ error: 'Failed to create footer content' });
    }
  } else if (req.method === 'PUT') {
    try {
      const { id, socialLinks, quickLinks, resourceLinks, ...updateData } = req.body;
      
      const footerContent = await prisma.footerContent.update({
        where: { id },
        data: {
          ...updateData,
          socialLinks: socialLinks ? JSON.stringify(socialLinks) : undefined,
          quickLinks: quickLinks ? JSON.stringify(quickLinks) : undefined,
          resourceLinks: resourceLinks ? JSON.stringify(resourceLinks) : undefined
        }
      });

      // Parse JSON fields for response
      const parsedFooterContent = {
        ...footerContent,
        socialLinks: JSON.parse(footerContent.socialLinks),
        quickLinks: JSON.parse(footerContent.quickLinks),
        resourceLinks: JSON.parse(footerContent.resourceLinks)
      };

      res.status(200).json(parsedFooterContent);
    } catch (error) {
      console.error('Error updating footer content:', error);
      res.status(500).json({ error: 'Failed to update footer content' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST', 'PUT']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
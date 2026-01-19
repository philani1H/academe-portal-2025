import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';
import formidable, { File } from 'formidable';
import fs from 'fs/promises';
import path from 'path';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'recordings');
    
    // Ensure upload directory exists before parsing
    await fs.mkdir(uploadDir, { recursive: true });

    const form = formidable({
      uploadDir,
      keepExtensions: true,
      maxFileSize: 500 * 1024 * 1024, // 500MB
      filename: (name, ext, part) => {
        // Generate unique filename during upload
        const timestamp = Date.now();
        return `recording-${timestamp}${ext}`;
      },
    });

    const [fields, files] = await form.parse(req);
    
    // Helper function to extract field value
    const getFieldValue = (field: string | string[] | undefined): string | undefined => {
      if (Array.isArray(field)) return field[0];
      return field;
    };

    const courseId = getFieldValue(fields.courseId);
    const sessionId = getFieldValue(fields.sessionId);
    const sessionName = getFieldValue(fields.sessionName);
    const duration = getFieldValue(fields.duration);
    
    const videoFile = Array.isArray(files.video) ? files.video[0] : files.video;

    if (!videoFile || !courseId) {
      // Clean up uploaded file if validation fails
      if (videoFile) {
        await fs.unlink(videoFile.filepath).catch(() => {});
      }
      return res.status(400).json({ error: 'Missing required fields: video and courseId' });
    }

    // Validate courseId is a valid number
    const courseIdNum = parseInt(courseId, 10);
    if (isNaN(courseIdNum)) {
      await fs.unlink(videoFile.filepath).catch(() => {});
      return res.status(400).json({ error: 'Invalid courseId format' });
    }

    // Verify course exists
    const courseExists = await prisma.course.findUnique({
      where: { id: courseIdNum },
      select: { id: true },
    });

    if (!courseExists) {
      await fs.unlink(videoFile.filepath).catch(() => {});
      return res.status(404).json({ error: 'Course not found' });
    }

    // Generate final filename with session info
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const ext = path.extname(videoFile.originalFilename || '.webm');
    const filename = `recording-${sessionId || timestamp}${ext}`;
    const relativePath = `/uploads/recordings/${filename}`;
    const absolutePath = path.join(uploadDir, filename);

    // Move/rename file to final location
    await fs.rename(videoFile.filepath, absolutePath);

    // Format duration for description
    const durationText = duration ? ` (Duration: ${duration})` : '';
    const recordingDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    // Save to database as course material
    const material = await prisma.courseMaterial.create({
      data: {
        courseId: courseIdNum,
        name: sessionName || `Live Session Recording - ${recordingDate}`,
        type: 'video',
        url: relativePath,
        description: `Recorded live session${durationText}`,
      },
    });

    return res.status(200).json({
      success: true,
      material,
      message: 'Recording saved successfully',
    });
  } catch (error) {
    console.error('Error saving recording:', error);
    
    // Provide more specific error messages
    if (error instanceof Error) {
      return res.status(500).json({ 
        error: 'Failed to save recording',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
    
    return res.status(500).json({ error: 'Failed to save recording' });
  }
}
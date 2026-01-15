import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';
import formidable from 'formidable';
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
    const form = formidable({
      uploadDir: path.join(process.cwd(), 'public', 'uploads', 'recordings'),
      keepExtensions: true,
      maxFileSize: 500 * 1024 * 1024, // 500MB
    });

    // Ensure upload directory exists
    await fs.mkdir(path.join(process.cwd(), 'public', 'uploads', 'recordings'), { recursive: true });

    const [fields, files] = await form.parse(req);
    
    const courseId = Array.isArray(fields.courseId) ? fields.courseId[0] : fields.courseId;
    const sessionId = Array.isArray(fields.sessionId) ? fields.sessionId[0] : fields.sessionId;
    const sessionName = Array.isArray(fields.sessionName) ? fields.sessionName[0] : fields.sessionName;
    const duration = Array.isArray(fields.duration) ? fields.duration[0] : fields.duration;
    
    const videoFile = Array.isArray(files.video) ? files.video[0] : files.video;

    if (!videoFile || !courseId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Generate filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `recording-${sessionId || timestamp}.webm`;
    const relativePath = `/uploads/recordings/${filename}`;
    const absolutePath = path.join(process.cwd(), 'public', relativePath);

    // Move file to final location
    await fs.rename(videoFile.filepath, absolutePath);

    // Save to database as course material
    const material = await prisma.courseMaterial.create({
      data: {
        courseId: parseInt(courseId),
        name: sessionName || `Live Session Recording - ${new Date().toLocaleDateString()}`,
        type: 'video',
        url: relativePath,
        description: `Recorded live session${duration ? ` (Duration: ${duration})` : ''}`,
      },
    });

    return res.status(200).json({
      success: true,
      material,
      message: 'Recording saved successfully',
    });
  } catch (error) {
    console.error('Error saving recording:', error);
    return res.status(500).json({ error: 'Failed to save recording' });
  }
}

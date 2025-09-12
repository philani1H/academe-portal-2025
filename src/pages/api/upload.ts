import { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
import fs from 'fs';
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
      maxFileSize: 10 * 1024 * 1024, // 10MB limit
      filter: ({ mimetype }) => {
        // Allow images and documents
        return Boolean(mimetype && mimetype.match(/^image\/(jpeg|jpg|png|gif|webp)$/) || 
                      mimetype && mimetype.match(/^application\/(pdf|msword|vnd\.openxmlformats-officedocument\.wordprocessingml\.document)$/));
      }
    });

    const [fields, files] = await form.parse(req);
    
    const file = Array.isArray(files.file) ? files.file[0] : files.file;
    
    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const extension = path.extname(file.originalFilename || '');
    const filename = `${timestamp}-${Math.random().toString(36).substring(2)}${extension}`;
    const filepath = path.join(uploadsDir, filename);

    // Move file to uploads directory
    fs.renameSync(file.filepath, filepath);

    // Return the public URL
    const url = `/uploads/${filename}`;
    
    return res.status(200).json({ url });
  } catch (error) {
    console.error('Error uploading file:', error);
    return res.status(500).json({ error: 'Failed to upload file' });
  }
}
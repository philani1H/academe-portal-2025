import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';

interface TutorData {
  name: string;
  subjects: string[];
  image?: string;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  description?: string;
  order?: number;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const { fileContent, fileType } = req.body;

    if (!fileContent) {
      return res.status(400).json({ error: 'No file content provided' });
    }

    let tutorData: TutorData[] = [];

    if (fileType === 'json') {
      tutorData = parseJSON(fileContent);
    } else if (fileType === 'csv') {
      tutorData = parseCSV(fileContent);
    } else {
      return res.status(400).json({ error: 'Unsupported file type. Please use JSON or CSV.' });
    }

    if (!tutorData || tutorData.length === 0) {
      return res.status(400).json({ error: 'No valid tutor data found in file' });
    }

    const validationErrors = validateTutorData(tutorData);
    if (validationErrors.length > 0) {
      return res.status(400).json({ error: 'Validation failed', details: validationErrors });
    }

    const results = await updateTutors(tutorData);

    res.status(200).json({
      message: 'Tutors updated successfully',
      updated: results.updated,
      created: results.created,
      total: results.total
    });
  } catch (error) {
    console.error('Error processing bulk tutor upload:', error);
    res.status(500).json({ 
      error: 'Failed to process tutor data',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

function parseJSON(content: string): TutorData[] {
  try {
    const data = JSON.parse(content);
    return Array.isArray(data) ? data : (data.tutors || []);
  } catch (error) {
    throw new Error('Invalid JSON format');
  }
}

function parseCSV(content: string): TutorData[] {
  try {
    const lines = content.trim().split('\n');
    if (lines.length < 2) throw new Error('CSV must have header and data rows');

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const tutorData: TutorData[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);
      if (values.length === 0) continue;

      const row: any = {};
      headers.forEach((header, index) => {
        if (values[index] !== undefined) {
          row[header] = values[index].trim();
        }
      });

      const tutor: TutorData = {
        name: row.name || '',
        subjects: parseArrayField(row.subjects),
        image: row.image || '',
        contactName: row.contactname || row['contact name'] || '',
        contactPhone: row.contactphone || row['contact phone'] || '',
        contactEmail: row.contactemail || row['contact email'] || '',
        description: row.description || '',
        order: parseInt(row.order) || 0
      };

      tutorData.push(tutor);
    }

    return tutorData;
  } catch (error) {
    throw new Error(`CSV parsing error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

function parseArrayField(value: string | undefined): string[] {
  if (!value) return [];
  if (value.startsWith('[') && value.endsWith(']')) {
    try {
      return JSON.parse(value);
    } catch {}
  }
  const separator = value.includes('|') ? '|' : ';';
  return value.split(separator).map(s => s.trim()).filter(s => s.length > 0);
}

function validateTutorData(data: TutorData[]): string[] {
  const errors: string[] = [];
  data.forEach((item, index) => {
    if (!item.name || item.name.trim() === '') {
      errors.push(`Row ${index + 1}: Name is required`);
    }
    if (!item.subjects || item.subjects.length === 0) {
      errors.push(`Row ${index + 1}: At least one subject is required`);
    }
  });
  return errors;
}

async function updateTutors(data: TutorData[]) {
  let updated = 0;
  let created = 0;

  for (const item of data) {
    const existing = await prisma.tutor.findFirst({
      where: { name: item.name }
    });

    const tutorData = {
      name: item.name,
      subjects: JSON.stringify(item.subjects),
      image: item.image || '',
      contactName: item.contactName || '',
      contactPhone: item.contactPhone || '',
      contactEmail: item.contactEmail || '',
      description: item.description || '',
      ratings: JSON.stringify([]),
      order: item.order || 0,
      isActive: true
    };

    if (existing) {
      await prisma.tutor.update({
        where: { id: existing.id },
        data: tutorData
      });
      updated++;
    } else {
      await prisma.tutor.create({
        data: tutorData
      });
      created++;
    }
  }

  return { updated, created, total: data.length };
}

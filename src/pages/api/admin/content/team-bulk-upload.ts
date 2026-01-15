import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';

interface TeamMemberData {
  name: string;
  role: string;
  bio?: string;
  image?: string;
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

    let teamData: TeamMemberData[] = [];

    if (fileType === 'json') {
      teamData = parseJSON(fileContent);
    } else if (fileType === 'csv') {
      teamData = parseCSV(fileContent);
    } else {
      return res.status(400).json({ error: 'Unsupported file type. Please use JSON or CSV.' });
    }

    if (!teamData || teamData.length === 0) {
      return res.status(400).json({ error: 'No valid team member data found in file' });
    }

    const validationErrors = validateTeamData(teamData);
    if (validationErrors.length > 0) {
      return res.status(400).json({ error: 'Validation failed', details: validationErrors });
    }

    const results = await updateTeamMembers(teamData);

    res.status(200).json({
      message: 'Team members updated successfully',
      updated: results.updated,
      created: results.created,
      total: results.total
    });
  } catch (error) {
    console.error('Error processing bulk team upload:', error);
    res.status(500).json({ 
      error: 'Failed to process team member data',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

function parseJSON(content: string): TeamMemberData[] {
  try {
    const data = JSON.parse(content);
    return Array.isArray(data) ? data : (data.team || data.teamMembers || []);
  } catch (error) {
    throw new Error('Invalid JSON format');
  }
}

function parseCSV(content: string): TeamMemberData[] {
  try {
    const lines = content.trim().split('\n');
    if (lines.length < 2) throw new Error('CSV must have header and data rows');

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const teamData: TeamMemberData[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);
      if (values.length === 0) continue;

      const row: any = {};
      headers.forEach((header, index) => {
        if (values[index] !== undefined) {
          row[header] = values[index].trim();
        }
      });

      const member: TeamMemberData = {
        name: row.name || '',
        role: row.role || '',
        bio: row.bio || '',
        image: row.image || '',
        order: parseInt(row.order) || 0
      };

      teamData.push(member);
    }

    return teamData;
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

function validateTeamData(data: TeamMemberData[]): string[] {
  const errors: string[] = [];
  data.forEach((item, index) => {
    if (!item.name || item.name.trim() === '') {
      errors.push(`Row ${index + 1}: Name is required`);
    }
    if (!item.role || item.role.trim() === '') {
      errors.push(`Row ${index + 1}: Role is required`);
    }
  });
  return errors;
}

async function updateTeamMembers(data: TeamMemberData[]) {
  let updated = 0;
  let created = 0;

  for (const item of data) {
    const existing = await prisma.teamMember.findFirst({
      where: { name: item.name }
    });

    const memberData = {
      name: item.name,
      role: item.role,
      bio: item.bio || '',
      image: item.image || '',
      order: item.order || 0,
      isActive: true
    };

    if (existing) {
      await prisma.teamMember.update({
        where: { id: existing.id },
        data: memberData
      });
      updated++;
    } else {
      await prisma.teamMember.create({
        data: memberData
      });
      created++;
    }
  }

  return { updated, created, total: data.length };
}

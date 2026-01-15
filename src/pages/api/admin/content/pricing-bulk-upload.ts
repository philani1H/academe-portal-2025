import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';

interface PricingData {
  name: string;
  price: string;
  period?: string;
  features?: string[];
  notIncluded?: string[];
  color?: string;
  icon?: string;
  popular?: boolean;
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

    let pricingData: PricingData[] = [];

    // Parse based on file type
    if (fileType === 'json') {
      pricingData = parseJSON(fileContent);
    } else if (fileType === 'csv') {
      pricingData = parseCSV(fileContent);
    } else {
      return res.status(400).json({ error: 'Unsupported file type. Please use JSON or CSV.' });
    }

    if (!pricingData || pricingData.length === 0) {
      return res.status(400).json({ error: 'No valid pricing data found in file' });
    }

    // Validate pricing data
    const validationErrors = validatePricingData(pricingData);
    if (validationErrors.length > 0) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: validationErrors 
      });
    }

    // Update or create pricing plans
    const results = await updatePricingPlans(pricingData);

    res.status(200).json({
      message: 'Pricing plans updated successfully',
      updated: results.updated,
      created: results.created,
      total: results.total
    });
  } catch (error) {
    console.error('Error processing bulk pricing upload:', error);
    res.status(500).json({ 
      error: 'Failed to process pricing data',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

function parseJSON(content: string): PricingData[] {
  try {
    const data = JSON.parse(content);
    
    // Handle both array and object with pricing array
    if (Array.isArray(data)) {
      return data;
    } else if (data.pricing && Array.isArray(data.pricing)) {
      return data.pricing;
    } else if (data.pricingPlans && Array.isArray(data.pricingPlans)) {
      return data.pricingPlans;
    }
    
    return [];
  } catch (error) {
    throw new Error('Invalid JSON format');
  }
}

function parseCSV(content: string): PricingData[] {
  try {
    const lines = content.trim().split('\n');
    if (lines.length < 2) {
      throw new Error('CSV must have at least a header row and one data row');
    }

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const pricingData: PricingData[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);
      if (values.length === 0) continue;

      const row: any = {};
      headers.forEach((header, index) => {
        if (values[index] !== undefined) {
          row[header] = values[index].trim();
        }
      });

      // Convert CSV row to PricingData
      const pricing: PricingData = {
        name: row.name || '',
        price: row.price || '',
        period: row.period || 'month',
        features: parseArrayField(row.features),
        notIncluded: parseArrayField(row.notincluded || row['not included']),
        color: row.color || 'bg-blue-500',
        icon: row.icon || 'Star',
        popular: parseBooleanField(row.popular),
        order: parseInt(row.order) || 0
      };

      pricingData.push(pricing);
    }

    return pricingData;
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
  
  // Handle JSON array format
  if (value.startsWith('[') && value.endsWith(']')) {
    try {
      return JSON.parse(value);
    } catch {
      // Fall through to pipe/semicolon parsing
    }
  }
  
  // Handle pipe or semicolon separated
  const separator = value.includes('|') ? '|' : ';';
  return value.split(separator).map(s => s.trim()).filter(s => s.length > 0);
}

function parseBooleanField(value: string | undefined): boolean {
  if (!value) return false;
  const lower = value.toLowerCase();
  return lower === 'true' || lower === 'yes' || lower === '1';
}

function validatePricingData(data: PricingData[]): string[] {
  const errors: string[] = [];

  data.forEach((item, index) => {
    if (!item.name || item.name.trim() === '') {
      errors.push(`Row ${index + 1}: Name is required`);
    }
    if (!item.price || item.price.trim() === '') {
      errors.push(`Row ${index + 1}: Price is required`);
    }
  });

  return errors;
}

async function updatePricingPlans(data: PricingData[]) {
  let updated = 0;
  let created = 0;

  for (const item of data) {
    // Check if plan exists by name
    const existing = await prisma.pricingPlan.findFirst({
      where: { name: item.name }
    });

    const planData = {
      name: item.name,
      price: item.price,
      period: item.period || 'month',
      features: JSON.stringify(item.features || []),
      notIncluded: JSON.stringify(item.notIncluded || []),
      color: item.color || 'bg-blue-500',
      icon: item.icon || 'Star',
      popular: item.popular || false,
      order: item.order || 0,
      isActive: true
    };

    if (existing) {
      await prisma.pricingPlan.update({
        where: { id: existing.id },
        data: planData
      });
      updated++;
    } else {
      await prisma.pricingPlan.create({
        data: planData
      });
      created++;
    }
  }

  return {
    updated,
    created,
    total: data.length
  };
}

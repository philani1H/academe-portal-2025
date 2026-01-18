import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generatePasswordFromName(name: string): string {
  // 1. Lowercase
  // 2. Replace spaces with dots
  // 3. Remove non-alphanumeric chars (except dots)
  const normalized = name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '.')
    .replace(/[^a-z0-9.]/g, '');
  
  return `${normalized}@EA25!`;
}
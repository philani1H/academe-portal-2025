/**
 * Student Number Generation Service
 *
 * Format: YYYYPPSSSSC (11 digits)
 * - YYYY: Registration year (4 digits)
 * - PP: Program code (2 digits)
 * - SSSS: Sequential student ID (4 digits)
 * - C: Check digit using Luhn algorithm (1 digit)
 *
 * Example: 20260100427
 */

/**
 * Program codes mapping
 */
export const PROGRAM_CODES = {
  EXCELLENCE_AKADEMIE: 1,  // Default
  MATH_PROGRAM: 2,
  SCIENCE_PROGRAM: 3,
  TUTORS: 99,
} as const

export type ProgramCode = typeof PROGRAM_CODES[keyof typeof PROGRAM_CODES]

/**
 * Calculate Luhn checksum digit (mod 10 algorithm)
 * Used by credit cards and other institutional numbering systems
 *
 * @param base - The base number string (without check digit)
 * @returns Check digit (0-9)
 */
export function calculateLuhnCheckDigit(base: string): number {
  const digits = base.split('').map(Number).reverse()

  let sum = 0
  for (let i = 0; i < digits.length; i++) {
    let digit = digits[i]

    // Double every second digit
    if (i % 2 === 0) {
      digit *= 2
      // If doubled digit is > 9, subtract 9 (equivalent to adding digits)
      if (digit > 9) {
        digit -= 9
      }
    }

    sum += digit
  }

  // Check digit makes the total sum divisible by 10
  const checkDigit = (10 - (sum % 10)) % 10
  return checkDigit
}

/**
 * Validate a student number using Luhn checksum
 *
 * @param studentNumber - Full 11-digit student number
 * @returns true if valid, false otherwise
 */
export function validateStudentNumber(studentNumber: string): boolean {
  // Must be exactly 11 digits
  if (!/^\d{11}$/.test(studentNumber)) {
    return false
  }

  const base = studentNumber.slice(0, 10)
  const providedCheckDigit = parseInt(studentNumber[10], 10)
  const calculatedCheckDigit = calculateLuhnCheckDigit(base)

  return providedCheckDigit === calculatedCheckDigit
}

/**
 * Generate a new student number
 *
 * @param year - Registration year (e.g., 2026)
 * @param programCode - Program code (1-99)
 * @param sequenceNumber - Sequential student ID (1-9999)
 * @returns Complete 11-digit student number with check digit
 */
export function generateStudentNumber(
  year: number,
  programCode: number,
  sequenceNumber: number
): string {
  // Validate inputs
  if (year < 2000 || year > 9999) {
    throw new Error(`Invalid year: ${year}`)
  }

  if (programCode < 1 || programCode > 99) {
    throw new Error(`Invalid program code: ${programCode}. Must be between 1 and 99.`)
  }

  if (sequenceNumber < 1 || sequenceNumber > 9999) {
    throw new Error(`Invalid sequence number: ${sequenceNumber}. Must be between 1 and 9999.`)
  }

  // Format components
  const yearStr = year.toString() // 4 digits
  const programStr = programCode.toString().padStart(2, '0') // 2 digits
  const seqStr = sequenceNumber.toString().padStart(4, '0') // 4 digits

  // Build base number (10 digits)
  const base = yearStr + programStr + seqStr

  // Calculate check digit
  const checkDigit = calculateLuhnCheckDigit(base)

  // Return complete student number
  return base + checkDigit.toString()
}

/**
 * Parse a student number into its components
 *
 * @param studentNumber - Full 11-digit student number
 * @returns Parsed components or null if invalid
 */
export function parseStudentNumber(studentNumber: string): {
  year: number
  programCode: number
  sequenceNumber: number
  checkDigit: number
  isValid: boolean
} | null {
  if (!validateStudentNumber(studentNumber)) {
    return null
  }

  return {
    year: parseInt(studentNumber.slice(0, 4), 10),
    programCode: parseInt(studentNumber.slice(4, 6), 10),
    sequenceNumber: parseInt(studentNumber.slice(6, 10), 10),
    checkDigit: parseInt(studentNumber.slice(10, 11), 10),
    isValid: true,
  }
}

/**
 * Generate student email from student number
 *
 * @param studentNumber - Full 11-digit student number
 * @returns Student email address
 */
export function generateStudentEmail(studentNumber: string): string {
  if (!validateStudentNumber(studentNumber)) {
    throw new Error(`Invalid student number: ${studentNumber}`)
  }

  return `${studentNumber}@excellenceakademie.co.za`
}

/**
 * Get the next sequence number for a given year and program
 * This should be called with database lock to ensure uniqueness
 *
 * @param year - Registration year
 * @param programCode - Program code
 * @param getMaxSequence - Function to get max sequence from database
 * @returns Next available sequence number
 */
export async function getNextSequenceNumber(
  year: number,
  programCode: number,
  getMaxSequence: (year: number, programCode: number) => Promise<number>
): Promise<number> {
  const maxSequence = await getMaxSequence(year, programCode)
  return maxSequence + 1
}

/**
 * Test script for the new student number generation system
 * Run with: tsx src/tests/test-student-number.ts
 */

import {
  generateStudentNumber,
  validateStudentNumber,
  parseStudentNumber,
  generateStudentEmail,
  calculateLuhnCheckDigit,
  PROGRAM_CODES,
} from '../lib/studentNumber.js'

console.log('🧪 Testing Student Number Generation System\n')
console.log('=' .repeat(60))

// Test 1: Generate student numbers
console.log('\n📝 Test 1: Generate Student Numbers')
console.log('-'.repeat(60))

const testCases = [
  { year: 2026, program: PROGRAM_CODES.EXCELLENCE_AKADEMIE, seq: 1 },
  { year: 2026, program: PROGRAM_CODES.EXCELLENCE_AKADEMIE, seq: 42 },
  { year: 2026, program: PROGRAM_CODES.MATH_PROGRAM, seq: 104 },
  { year: 2026, program: PROGRAM_CODES.SCIENCE_PROGRAM, seq: 999 },
  { year: 2026, program: PROGRAM_CODES.TUTORS, seq: 1 },
]

for (const test of testCases) {
  const studentNumber = generateStudentNumber(test.year, test.program, test.seq)
  const email = generateStudentEmail(studentNumber)
  const expectedDomain = '@excellenceakademie.co.za'
  const correctDomain = email.endsWith(expectedDomain)
  console.log(`Year ${test.year}, Program ${test.program.toString().padStart(2, '0')}, Seq ${test.seq.toString().padStart(4, '0')}`)
  console.log(`  → Student Number: ${studentNumber}`)
  console.log(`  → Email: ${email}`)
  console.log(`  → Valid: ${validateStudentNumber(studentNumber) ? '✅' : '❌'}`)
  console.log(`  → Domain: ${correctDomain ? '✅' : '❌'}`)
}

// Test 2: Validate check digit
console.log('\n✅ Test 2: Validate Check Digit Algorithm')
console.log('-'.repeat(60))

const validNumbers = [
  '20260100017', // First student 2026
  '20260100427', // 42nd student
  '20260201049', // 104th student, program 02
]

for (const num of validNumbers) {
  const isValid = validateStudentNumber(num)
  const parsed = parseStudentNumber(num)
  console.log(`${num}: ${isValid ? '✅ Valid' : '❌ Invalid'}`)
  if (parsed) {
    console.log(`  Year: ${parsed.year}, Program: ${parsed.programCode}, Seq: ${parsed.sequenceNumber}, Check: ${parsed.checkDigit}`)
  }
}

// Test 3: Invalid numbers should fail
console.log('\n❌ Test 3: Invalid Numbers Should Fail')
console.log('-'.repeat(60))

const invalidNumbers = [
  '20260100018', // Wrong check digit (should be 7)
  '12345',       // Too short
  'abc12345678', // Non-numeric
  '20260100420', // Wrong check digit
]

for (const num of invalidNumbers) {
  const isValid = validateStudentNumber(num)
  console.log(`${num}: ${isValid ? '❌ SHOULD BE INVALID!' : '✅ Correctly rejected'}`)
}

// Test 4: Luhn algorithm examples
console.log('\n🔢 Test 4: Luhn Check Digit Calculation')
console.log('-'.repeat(60))

const bases = [
  '2026010001', // First student
  '2026010042', // 42nd student
  '2026020104', // 104th student, program 02
]

for (const base of bases) {
  const checkDigit = calculateLuhnCheckDigit(base)
  const fullNumber = base + checkDigit.toString()
  console.log(`Base: ${base} → Check Digit: ${checkDigit} → Full: ${fullNumber}`)
  console.log(`  Valid: ${validateStudentNumber(fullNumber) ? '✅' : '❌'}`)
}

// Test 5: Email generation
console.log('\n📧 Test 5: Email Generation')
console.log('-'.repeat(60))

const expectedDomain = '@excellenceakademie.co.za'
console.log(`Expected domain: ${expectedDomain}`)
console.log('')

for (const test of testCases) {
  const studentNumber = generateStudentNumber(test.year, test.program, test.seq)
  const email = generateStudentEmail(studentNumber)
  const correctDomain = email.endsWith(expectedDomain)
  console.log(`${studentNumber} → ${email} ${correctDomain ? '✅' : '❌'}`)
}

console.log('\n🎓 Domain Verification')
console.log('-'.repeat(60))
const testEmail = generateStudentEmail(generateStudentNumber(2026, 1, 1))
if (testEmail.includes('@students.excellenceakademie.co.za')) {
  console.log('❌ WRONG DOMAIN: Using @students.excellenceakademie.co.za')
  console.log('Should be: @excellenceakademie.co.za')
} else if (testEmail.includes('@excellenceakademie.co.za')) {
  console.log('✅ CORRECT DOMAIN: Using @excellenceakademie.co.za')
} else {
  console.log('❌ UNKNOWN DOMAIN:', testEmail.split('@')[1])
}

console.log('\n' + '='.repeat(60))
console.log('✅ All tests completed!')
console.log('=' .repeat(60))

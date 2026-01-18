#!/usr/bin/env tsx
/**
 * Endpoint Verification Script
 *
 * This script verifies that all API endpoints are properly defined
 * and would be accessible when the server runs.
 */

import fs from 'fs'
import path from 'path'

const serverFilePath = path.join(process.cwd(), 'src/server/index.ts')
const serverCode = fs.readFileSync(serverFilePath, 'utf-8')

// Define all expected endpoints
const expectedEndpoints = {
  'STUDENT ENDPOINTS': [
    { method: 'GET', path: '/api/student/assignments', description: 'Fetch assignments' },
    { method: 'POST', path: '/api/student/assignments', description: 'Submit assignment' },
    { method: 'GET', path: '/api/student/tests', description: 'Fetch tests' },
    { method: 'POST', path: '/api/student/tests', description: 'Submit test' },
    { method: 'GET', path: '/api/student/courses', description: 'Get courses' },
    { method: 'POST', path: '/api/student/courses', description: 'Enroll in course' },
    { method: 'DELETE', path: '/api/student/courses', description: 'Unenroll from course' },
    { method: 'GET', path: '/api/student/scheduled-sessions', description: 'Get scheduled sessions' },
  ],
  'TUTOR ENDPOINTS': [
    { method: 'GET', path: '/api/tutor/materials', description: 'Fetch materials' },
    { method: 'POST', path: '/api/tutor/materials', description: 'Upload material' },
    { method: 'DELETE', path: '/api/tutor/materials', description: 'Delete material' },
    { method: 'GET', path: '/api/tutor/courses', description: 'Fetch courses' },
    { method: 'POST', path: '/api/tutor/courses', description: 'Create course' },
    { method: 'PUT', path: '/api/tutor/courses', description: 'Update course' },
    { method: 'POST', path: '/api/tutor/students', description: 'Enroll student' },
    { method: 'PUT', path: '/api/tutor/students', description: 'Update student' },
    { method: 'DELETE', path: '/api/tutor/students', description: 'Remove student' },
    { method: 'GET', path: '/api/tutor/tests', description: 'Fetch tests' },
    { method: 'POST', path: '/api/tutor/tests', description: 'Create test' },
    { method: 'PUT', path: '/api/tutor/tests', description: 'Update test' },
    { method: 'DELETE', path: '/api/tutor/tests', description: 'Delete test' },
    { method: 'GET', path: '/api/tutor/assignments', description: 'Fetch assignments' },
    { method: 'POST', path: '/api/tutor/assignments', description: 'Create assignment' },
    { method: 'PUT', path: '/api/tutor/assignments', description: 'Update assignment' },
    { method: 'DELETE', path: '/api/tutor/assignments', description: 'Delete assignment' },
    { method: 'GET', path: '/api/tutor/scheduled-sessions', description: 'Fetch sessions' },
    { method: 'POST', path: '/api/tutor/scheduled-sessions', description: 'Schedule session' },
    { method: 'PUT', path: '/api/tutor/scheduled-sessions', description: 'Update session' },
    { method: 'DELETE', path: '/api/tutor/scheduled-sessions', description: 'Delete session' },
  ]
}

console.log('🔍 Verifying API Endpoints...\n')

let totalEndpoints = 0
let foundEndpoints = 0
let missingEndpoints: string[] = []

for (const [category, endpoints] of Object.entries(expectedEndpoints)) {
  console.log(`\n📂 ${category}`)
  console.log('─'.repeat(60))

  for (const endpoint of endpoints) {
    totalEndpoints++

    // Build regex to find the endpoint definition
    const methodLower = endpoint.method.toLowerCase()
    const escapedPath = endpoint.path.replace(/\//g, '\\/').replace(/\?/g, '\\?')
    const regex = new RegExp(`app\\.${methodLower}\\("${escapedPath}"`, 'g')

    const found = regex.test(serverCode)

    if (found) {
      foundEndpoints++
      console.log(`  ✅ ${endpoint.method.padEnd(6)} ${endpoint.path.padEnd(40)} ${endpoint.description}`)
    } else {
      missingEndpoints.push(`${endpoint.method} ${endpoint.path}`)
      console.log(`  ❌ ${endpoint.method.padEnd(6)} ${endpoint.path.padEnd(40)} ${endpoint.description}`)
    }
  }
}

// Check for authentication middleware
console.log('\n\n🔐 Security Checks')
console.log('─'.repeat(60))

const hasAuthMiddleware = /authenticateJWT/.test(serverCode)
const hasRoleAuth = /authorizeRoles/.test(serverCode)

console.log(`  ${hasAuthMiddleware ? '✅' : '❌'} JWT Authentication middleware`)
console.log(`  ${hasRoleAuth ? '✅' : '❌'} Role-based authorization`)

// Summary
console.log('\n\n📊 SUMMARY')
console.log('═'.repeat(60))
console.log(`  Total Expected Endpoints:  ${totalEndpoints}`)
console.log(`  Found Endpoints:           ${foundEndpoints}`)
console.log(`  Missing Endpoints:         ${missingEndpoints.length}`)
console.log(`  Success Rate:              ${((foundEndpoints / totalEndpoints) * 100).toFixed(1)}%`)

if (missingEndpoints.length > 0) {
  console.log('\n\n⚠️  Missing Endpoints:')
  missingEndpoints.forEach(endpoint => console.log(`     - ${endpoint}`))
}

if (foundEndpoints === totalEndpoints) {
  console.log('\n\n🎉 SUCCESS! All endpoints are properly implemented!')
  console.log('\n✅ Next steps:')
  console.log('   1. Pull latest changes: git pull origin claude/fix-admin-seed-error-uaKaR')
  console.log('   2. Generate Prisma client: npx prisma generate')
  console.log('   3. Run migration: npx prisma migrate dev --name add_assignments_and_fix_mappings')
  console.log('   4. Start server: npm run dev')
  process.exit(0)
} else {
  console.log('\n\n❌ Some endpoints are missing. Please review the implementation.')
  process.exit(1)
}

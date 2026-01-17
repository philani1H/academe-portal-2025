#!/usr/bin/env tsx
/**
 * Database Health Check and Setup Script
 *
 * This script:
 * 1. Checks connection to Neon PostgreSQL
 * 2. Lists all existing tables
 * 3. Counts records in key tables
 * 4. Optionally runs migrations if tables are missing
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkDatabase() {
  console.log('🔍 Checking Neon PostgreSQL Database Connection...\n')

  try {
    // Test connection
    await prisma.$connect()
    console.log('✅ Successfully connected to Neon PostgreSQL!\n')

    // Get all tables
    console.log('📊 Checking database tables...\n')
    const tables = await prisma.$queryRaw<any[]>`
      SELECT tablename
      FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY tablename;
    `

    if (tables.length === 0) {
      console.log('⚠️  No tables found in database!')
      console.log('💡 Run migrations to create tables: npx prisma migrate deploy\n')
      return
    }

    console.log(`Found ${tables.length} tables:`)
    tables.forEach((table, index) => {
      console.log(`  ${index + 1}. ${table.tablename}`)
    })
    console.log()

    // Check for critical tables and count records
    console.log('📈 Checking data in key tables...\n')

    const checks = [
      { name: 'Users', model: prisma.user },
      { name: 'Admin Users', model: prisma.adminUser },
      { name: 'Courses', model: prisma.course },
      { name: 'Features', model: prisma.feature },
      { name: 'Hero Content', model: prisma.heroContent },
      { name: 'Scheduled Sessions', model: prisma.scheduledSession },
    ]

    for (const check of checks) {
      try {
        const count = await check.model.count()
        const status = count > 0 ? '✅' : '⚠️ '
        console.log(`${status} ${check.name}: ${count} records`)
      } catch (error: any) {
        if (error.code === 'P2021') {
          console.log(`❌ ${check.name}: Table does not exist`)
        } else {
          console.log(`❌ ${check.name}: Error - ${error.message}`)
        }
      }
    }

    console.log('\n✨ Database check complete!\n')

    // Recommendations
    const userCount = await prisma.user.count().catch(() => 0)
    const adminCount = await prisma.adminUser.count().catch(() => 0)
    const heroCount = await prisma.heroContent.count().catch(() => 0)

    if (adminCount === 0) {
      console.log('💡 Recommendation: No admin users found. The server will try to create one on startup.')
    }
    if (userCount === 0) {
      console.log('💡 Recommendation: No users found. Run: npm run seed')
    }
    if (heroCount === 0) {
      console.log('💡 Recommendation: No hero content found. Run: npm run seed:all')
    }

  } catch (error: any) {
    console.error('❌ Database connection failed!\n')
    console.error('Error:', error.message)

    if (error.message.includes("Can't reach database server")) {
      console.log('\n💡 Troubleshooting steps:')
      console.log('  1. Check your .env file has the correct DATABASE_URL')
      console.log('  2. Verify your Neon database is running')
      console.log('  3. Check your internet connection')
      console.log('  4. Ensure the Neon project is not paused/suspended')
    }

    if (error.code === 'P2021') {
      console.log('\n💡 Tables are missing. Run: npx prisma migrate deploy')
    }
  } finally {
    await prisma.$disconnect()
  }
}

checkDatabase()
  .catch(console.error)
  .finally(() => process.exit(0))

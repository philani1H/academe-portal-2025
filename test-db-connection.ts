import { PrismaClient } from '@prisma/client'

// Test database connection with optimized settings
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  },
  log: ['query', 'info', 'warn', 'error'],
})

async function testConnection() {
  try {
    console.log('Testing database connection...')
    
    // Test basic connection
    await prisma.$connect()
    console.log('✅ Database connected successfully')
    
    // Test a simple query
    const userCount = await prisma.user.count()
    console.log(`✅ Query successful - Found ${userCount} users`)
    
    // Test connection info
    const result = await prisma.$queryRaw`SELECT version()`
    console.log('✅ Database version:', result)
    
  } catch (error) {
    console.error('❌ Database connection failed:', error)
    
    if (error.code === 'P1001') {
      console.log('\n🔧 Troubleshooting steps:')
      console.log('1. Check if your Neon database is active (not sleeping)')
      console.log('2. Verify your DATABASE_URL is correct')
      console.log('3. Check Neon console for any issues')
      console.log('4. Try restarting your Neon database')
    }
  } finally {
    await prisma.$disconnect()
  }
}

testConnection()
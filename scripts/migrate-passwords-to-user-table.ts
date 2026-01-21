import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import sqlite3 from 'sqlite3'
import { open } from 'sqlite'

const prisma = new PrismaClient()

async function getConnection() {
  return open({
    filename: './user_credentials.db',
    driver: sqlite3.Database
  })
}

async function migratePasswordsToUserTable() {
  console.log('🔄 Starting password migration to User table...')
  
  try {
    // Get all users from Prisma
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        password_hash: true
      }
    })

    console.log(`📊 Found ${users.length} users in User table`)

    // Get credentials from SQLite
    const db = await getConnection()
    const credentials = await db.all("SELECT * FROM user_credentials")
    await db.close()

    console.log(`📊 Found ${credentials.length} credentials in credentials table`)

    let migrated = 0
    let skipped = 0
    let errors = 0

    for (const user of users) {
      try {
        // Skip if user already has a bcrypt hash
        if (user.password_hash && user.password_hash.startsWith('$2')) {
          console.log(`✅ User ${user.email} already has bcrypt hash, skipping`)
          skipped++
          continue
        }

        // Find matching credential
        const credential = credentials.find(c => c.email === user.email)
        
        if (!credential || !credential.password_hash) {
          console.log(`⚠️  No credential found for user ${user.email}`)
          continue
        }

        // Parse scrypt hash
        const [scheme, salt, stored] = credential.password_hash.split(':')
        
        if (scheme !== 'scrypt' || !salt || !stored) {
          console.log(`⚠️  Invalid hash format for user ${user.email}`)
          continue
        }

        // We can't reverse scrypt, so we'll generate a new password
        // This is the same method used in the system
        const generatePasswordFromName = (name: string): string => {
          if (!name) return 'temp123'
          
          const cleanName = name.toLowerCase().replace(/[^a-z]/g, '')
          if (cleanName.length < 3) return 'temp123'
          
          const firstThree = cleanName.substring(0, 3)
          const randomNum = Math.floor(Math.random() * 900) + 100
          return `${firstThree}${randomNum}`
        }

        const newPassword = generatePasswordFromName(user.name)
        const bcryptHash = await bcrypt.hash(newPassword, 10)

        // Update User table with bcrypt hash
        await prisma.user.update({
          where: { id: user.id },
          data: { password_hash: bcryptHash }
        })

        // Update credentials table with new scrypt hash
        const newScryptHash = await new Promise<string>((resolve, reject) => {
          const newSalt = crypto.randomBytes(16).toString('hex')
          crypto.scrypt(newPassword, newSalt, 64, (err, derivedKey) => {
            if (err) reject(err)
            else resolve(`scrypt:${newSalt}:${derivedKey.toString('hex')}`)
          })
        })

        const db2 = await getConnection()
        await db2.run(
          "UPDATE user_credentials SET password_hash = ?, updated_at = ? WHERE email = ?",
          [newScryptHash, new Date().toISOString(), user.email]
        )
        await db2.close()

        console.log(`✅ Migrated user ${user.email} (${user.role}) - New password: ${newPassword}`)
        migrated++

      } catch (error) {
        console.error(`❌ Error migrating user ${user.email}:`, error)
        errors++
      }
    }

    console.log('\n📈 Migration Summary:')
    console.log(`✅ Migrated: ${migrated} users`)
    console.log(`⏭️  Skipped: ${skipped} users (already had bcrypt)`)
    console.log(`❌ Errors: ${errors} users`)
    
    if (migrated > 0) {
      console.log('\n🔑 New passwords generated for migrated users:')
      console.log('Users will need to use their new generated passwords to login.')
      console.log('Consider sending credential emails to affected users.')
    }

  } catch (error) {
    console.error('❌ Migration failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Run migration
migratePasswordsToUserTable()
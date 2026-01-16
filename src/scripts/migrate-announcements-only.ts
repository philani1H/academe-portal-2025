import prisma from '../lib/prisma'

// Announcements data - posted today
const announcementsData = [
  {
    title: "Welcome to Excellence Academia 2025",
    content: "Greetings, Class of 2025! Welcome to Excellence Academia, your premier online tutoring centre dedicated to empowering learners through high-quality, personalised education.",
    type: "info",
    pinned: true,
    authorId: 1
  },
  {
    title: "New Tutoring Packages Available",
    content: "New Mathematics and Science tutoring packages now available! Limited spots remaining for the upcoming term.",
    type: "info",
    pinned: false,
    authorId: 1
  }
]

async function migrateAnnouncements() {
  console.log('Starting announcements migration...')

  try {
    // Clear existing announcements with authorId: 1
    console.log('Clearing existing system announcements...')
    await prisma.announcements.deleteMany({
      where: { authorId: 1 }
    })

    // Migrate Announcements
    console.log('Migrating announcements...')
    for (const announcement of announcementsData) {
      await prisma.announcements.create({
        data: { 
          title: announcement.title,          // from data
          content: announcement.content,      // from data
          type: announcement.type,            // from data
          pinned: announcement.pinned,        // from data
          authorId: announcement.authorId,    // from data (1 - system admin)
          department: null                    // no department assignment
        }
      })
    }
    console.log(`✓ Migrated ${announcementsData.length} announcements`)

    // Summary
    console.log('\n' + '='.repeat(60))
    console.log('🎉 ANNOUNCEMENTS MIGRATION COMPLETED! 🎉')
    console.log('='.repeat(60))
    console.log(`\n✓ Total Announcements: ${announcementsData.length}`)
    console.log(`✓ Posted Date: ${new Date().toLocaleDateString()}`)
    console.log(`✓ Author ID: 1 (System Admin)`)
    console.log('\n📋 Data Structure:')
    console.log('   • title        - from data')
    console.log('   • content      - from data')
    console.log('   • type         - from data')
    console.log('   • pinned       - from data')
    console.log('   • authorId: 1  - from data (system admin)')
    console.log('   • department   - null (no assignment)')
    console.log('='.repeat(60) + '\n')
    
  } catch (error) {
    console.error('\n' + '='.repeat(60))
    console.error('❌ MIGRATION FAILED!')
    console.error('='.repeat(60))
    console.error('\n💥 Error Details:', error)
    console.error('\n' + '='.repeat(60) + '\n')
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run the migration
migrateAnnouncements()
  .then(() => {
    console.log('✅ Process completed successfully')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Process failed')
    process.exit(1)
  })

export default migrateAnnouncements
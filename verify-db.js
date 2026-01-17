// Quick Database Connection Verification Script
// Run: node verify-db.js

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyDatabase() {
  console.log('🔍 Verifying database connection...\n');

  try {
    // Test connection
    await prisma.$connect();
    console.log('✅ Database connection successful!\n');

    // Check AdminUsers
    const adminCount = await prisma.adminUser.count();
    console.log(`📊 Admin Users: ${adminCount}`);
    if (adminCount > 0) {
      const admins = await prisma.adminUser.findMany({ take: 3 });
      admins.forEach(admin => {
        const email = admin.email || admin.personalEmail || 'no email';
        console.log(`   - ${admin.username} (${email})`);
      });
    }

    // Check Users (tutors, students)
    const userCount = await prisma.user.count();
    console.log(`\n📊 System Users: ${userCount}`);
    if (userCount > 0) {
      const tutorCount = await prisma.user.count({ where: { role: 'tutor' } });
      const studentCount = await prisma.user.count({ where: { role: 'student' } });
      console.log(`   - Tutors: ${tutorCount}`);
      console.log(`   - Students: ${studentCount}`);
    }

    // Check Courses
    const courseCount = await prisma.course.count();
    console.log(`\n📊 Courses: ${courseCount}`);
    if (courseCount > 0) {
      const courses = await prisma.course.findMany({ take: 3 });
      courses.forEach(course => {
        console.log(`   - ${course.name}`);
      });
    }

    // Check Scheduled Sessions
    const sessionCount = await prisma.scheduledSession.count();
    console.log(`\n📊 Scheduled Sessions: ${sessionCount}`);

    // Check Timetable Entries
    const timetableCount = await prisma.timetableEntry.count();
    console.log(`📊 Timetable Entries: ${timetableCount}`);

    console.log('\n✅ All tables exist and are accessible!');
    console.log('\n🎉 Your database is ready to use!');

  } catch (error) {
    console.error('\n❌ Database Error:', error.message);

    if (error.code === 'P2021') {
      console.log('\n⚠️  Tables do not exist yet. Run:');
      console.log('   npx prisma db push\n');
    } else if (error.code === 'P1001') {
      console.log('\n⚠️  Cannot reach database server. Check:');
      console.log('   1. Internet connection');
      console.log('   2. Neon database is awake\n');
    }
  } finally {
    await prisma.$disconnect();
  }
}

verifyDatabase();

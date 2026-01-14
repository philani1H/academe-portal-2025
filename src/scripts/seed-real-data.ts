
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding real data...');

  // 1. Get existing courses
  const courses = await prisma.course.findMany({
    include: { tutor: true }
  });

  if (courses.length === 0) {
    console.log('No courses found. Please run the initial seed script first.');
    return;
  }

  for (const course of courses) {
    console.log(`Processing course: ${course.name}`);

    // 2. Add Materials if none exist
    const existingMaterials = await prisma.courseMaterial.findMany({
      where: { courseId: course.id }
    });

    if (existingMaterials.length === 0) {
      console.log('  Adding materials...');
      await prisma.courseMaterial.createMany({
        data: [
          {
            courseId: course.id,
            name: 'Course Syllabus',
            type: 'pdf',
            url: '/materials/syllabus.pdf',
            description: 'Overview of the course curriculum and grading.'
          },
          {
            courseId: course.id,
            name: 'Week 1 Lecture Notes',
            type: 'pdf',
            url: '/materials/week1.pdf',
            description: 'Introduction to the subject.'
          },
          {
            courseId: course.id,
            name: 'Introductory Video',
            type: 'video',
            url: '/materials/intro.mp4',
            description: 'Welcome video from the tutor.'
          }
        ]
      });
    } else {
      console.log('  Materials already exist.');
    }

    // 3. Add Announcements if none exist
    const existingAnnouncements = await prisma.courseAnnouncement.findMany({
      where: { courseId: course.id }
    });

    if (existingAnnouncements.length === 0) {
      console.log('  Adding announcements...');
      await prisma.courseAnnouncement.createMany({
        data: [
          {
            courseId: course.id,
            title: 'Welcome to the course!',
            content: 'We are excited to have you here. Please check the syllabus.'
          },
          {
            courseId: course.id,
            title: 'First Live Session',
            content: 'Join us this Friday for our first live session.'
          }
        ]
      });
    } else {
      console.log('  Announcements already exist.');
    }
  }

  // 4. Add Notifications for Students
  const students = await prisma.user.findMany({
    where: { role: 'student' }
  });

  for (const student of students) {
      const existingNotifications = await prisma.notification.findMany({
          where: { userId: student.id }
      });

      if (existingNotifications.length === 0) {
          console.log(`  Adding notifications for student: ${student.name}`);
          await prisma.notification.createMany({
              data: [
                  {
                      userId: student.id,
                      title: 'Welcome!',
                      message: 'Welcome to Academe Portal. Your journey begins here.',
                      type: 'admin',
                      read: false
                  },
                  {
                      userId: student.id,
                      title: 'Complete your profile',
                      message: 'Please update your profile information.',
                      type: 'admin',
                      read: true
                  }
              ]
          });
      }
  }

  console.log('Seeding completed.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

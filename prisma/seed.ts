import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 10)
  const admin = await prisma.adminUser.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      displayName: 'System Administrator',
      email: 'admin@academe.com',
      passwordHash: adminPassword,
      permissions: 'all',
    },
  })
  console.log('✅ Created admin user:', admin.username)

  // Create sample tutor user
  const tutorPassword = await bcrypt.hash('tutor123', 10)
  const tutor = await prisma.user.upsert({
    where: { email: 'tutor@academe.com' },
    update: {},
    create: {
      name: 'Dr. Sarah Wilson',
      email: 'tutor@academe.com',
      password_hash: tutorPassword,
      role: 'tutor',
      department: 'Mathematics',
      subjects: JSON.stringify(['Mathematics', 'Physics']),
    },
  })
  console.log('✅ Created tutor user:', tutor.name)

  // Create sample student user
  const studentPassword = await bcrypt.hash('student123', 10)
  const student = await prisma.user.upsert({
    where: { email: 'student@academe.com' },
    update: {},
    create: {
      name: 'John Smith',
      email: 'student@academe.com',
      studentNumber: 'STU001',
      password_hash: studentPassword,
      role: 'student',
    },
  })
  console.log('✅ Created student user:', student.name)

  // Create sample course
  const course = await prisma.course.upsert({
    where: { id: 1 },
    update: {},
    create: {
      name: 'Advanced Mathematics',
      description: 'Comprehensive course covering calculus, algebra, and statistics',
      category: 'Mathematics',
      department: 'Mathematics',
      tutorId: tutor.id,
    },
  })
  console.log('✅ Created course:', course.name)

  // Create sample departments (content)
  const departments = [
    { name: 'Mathematics', color: '#4f46e5' },
    { name: 'Science', color: '#10b981' },
    { name: 'Languages', color: '#f59e0b' },
    { name: 'Technology', color: '#8b5cf6' },
  ]

  for (const dept of departments) {
    console.log(`✅ Department available: ${dept.name}`)
  }

  // Create hero content
  await prisma.heroContent.upsert({
    where: { id: 'default-hero' },
    update: {},
    create: {
      id: 'default-hero',
      title: 'Excellence in Education',
      subtitle: 'Transform Your Learning Journey',
      description: 'Join thousands of students achieving academic excellence with our expert tutors',
      buttonText: 'Get Started',
      secondaryButtonText: 'Learn More',
      trustIndicatorText: '1000+ Students Taught',
      universities: JSON.stringify(['UCT', 'Wits', 'Stellenbosch']),
      features: JSON.stringify(['Expert Tutors', 'Flexible Schedule', 'Proven Results']),
      backgroundGradient: 'from-blue-900 to-purple-900',
      isActive: true,
    },
  })
  console.log('✅ Created hero content')

  // Create pricing plans
  const pricingPlans = [
    {
      id: 'basic-plan',
      name: 'Basic',
      price: 'R500',
      period: 'per month',
      features: JSON.stringify(['4 sessions/month', 'Group classes', 'Email support']),
      notIncluded: JSON.stringify(['1-on-1 sessions', 'Priority support']),
      color: '#4f46e5',
      icon: 'BookOpen',
      popular: false,
      order: 1,
    },
    {
      id: 'premium-plan',
      name: 'Premium',
      price: 'R1200',
      period: 'per month',
      features: JSON.stringify(['8 sessions/month', 'Group + 1-on-1', 'Priority support', 'Study materials']),
      notIncluded: JSON.stringify([]),
      color: '#10b981',
      icon: 'Star',
      popular: true,
      order: 2,
    },
  ]

  for (const plan of pricingPlans) {
    await prisma.pricingPlan.upsert({
      where: { id: plan.id },
      update: {},
      create: plan,
    })
    console.log(`✅ Created pricing plan: ${plan.name}`)
  }

  console.log('🎉 Database seeded successfully!')
  console.log('\n📝 Login Credentials:')
  console.log('Admin: admin / admin123')
  console.log('Tutor: tutor@academe.com / tutor123')
  console.log('Student: student@academe.com / student123')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

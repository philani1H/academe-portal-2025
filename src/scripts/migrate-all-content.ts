import prisma from '../lib/prisma'

// Tutors data from Tutors.tsx
const tutorsData = [
  {
    name: "Sir Raphael",
    subjects: JSON.stringify(["Maths Literacy", "English FAL", "History"]),
    image: "https://media-hosting.imagekit.io/b0f14e9cd7c04663/WhatsApp%20Image%202025-05-01%20at%2017.51.06_9b6f06d5.jpg?Expires=1841310263&Key-Pair-Id=K2ZIVPTIP2VGHC&Signature=ljztxmw-I6~Xh722izM58x2kFLzby8tvwS94aMVLD-VoFavdzLkPtLWovsyimHY97gAkebJyTLONPvBLRbebhXEIErl~bj7GkLUUHhxE0vgqBA~h9z~Jqhb3ZxZnfsHD8AmTfOs0Y63e61SjiIQd9gLrMcdFKtf-PFLcmq055kFgZNTt9t4jJNCNF95uJAyeWuCPmHxP7hx9RBk5McLl7pVWKNUC1LVfIQupvFqzJfRGLHLOsB~9K-Dp0tQLKQVI2a11Pogn6bKqnLBuW1eIWid0uV7QTzqRD2dDOB3UCgL2fDzIgTD2~l4D~fFPtF0VAeH-tKfb6YFkdPB5m8ZVEA__",
    contactName: "Sir Raphael",
    contactPhone: "+27698635814",
    contactEmail: "ExcellenceAcademia2025@gmail.com",
    description: "Sir Raphael specializes in Maths Literacy, English FAL, and History. He is dedicated to helping students achieve their academic goals through personalized instruction and comprehensive understanding.",
    ratings: JSON.stringify([
      {
        id: 1,
        studentName: "Initial Rating",
        rating: 4,
        comment: "Excellent teaching methodology and student engagement.",
        date: "2025-04-02"
      }
    ]),
    order: 1
  },
  {
    name: "Roshan (mr mvp)",
    subjects: JSON.stringify(["Geography", "Business Studies", "Economics"]),
    image: "https://i.imgur.com/GqzI3ir.jpeg",
    contactName: "Roshan",
    contactPhone: "+27 79 386 7427",
    contactEmail: "ExcellenceAcademia2025@gmail.com",
    description: "Roshan, nicknamed (mr mvp), brings a wealth of knowledge in Economics and Geography. He believes in fostering critical thinking skills and a love for learning.",
    ratings: JSON.stringify([
      {
        id: 1,
        studentName: "Michael S.",
        rating: 5,
        comment: "Excellent teacher! Made economics easy to understand.",
        date: "2025-03-15"
      },
      {
        id: 2,
        studentName: "Sarah J.",
        rating: 4,
        comment: "Very knowledgeable and patient.",
        date: "2025-02-28"
      }
    ]),
    order: 2
  },
  {
    name: "Paballo",
    subjects: JSON.stringify(["Pure Mathematics", "Economics", "Business", "Accounting"]),
    image: "https://i.imgur.com/mreslkv.jpeg",
    contactName: "Paballo A.L Sempe",
    contactPhone: "+27761328919",
    contactEmail: "ExcellenceAcademia2025@gmail.com",
    description: "Paballo has a strong background in pure mathematics, economics, and accounting. She focuses on making complex concepts accessible and engaging for students.",
    ratings: JSON.stringify([
      {
        id: 1,
        studentName: "David K.",
        rating: 5,
        comment: "Paballo explains math concepts clearly and patiently.",
        date: "2025-03-20"
      }
    ]),
    order: 3
  },
  {
    name: "Promise Chabalala",
    subjects: JSON.stringify(["Afrikaans FAL", "English HL", "Business Studies", "History"]),
    image: "https://i.imgur.com/pf6NDEJ.jpeg",
    contactName: "Promise Chabalala",
    contactPhone: "+27 67 401 6982",
    contactEmail: "ExcellenceAcademia2025@gmail.com",
    description: "Promise brings a wealth of knowledge in language and humanities. She believes in fostering critical thinking skills and a love for learning.",
    ratings: JSON.stringify([
      {
        id: 1,
        studentName: "Thabo M.",
        rating: 5,
        comment: "Excellent Afrikaans tutor! Very patient and understanding.",
        date: "2025-03-10"
      }
    ]),
    order: 4
  }
]

// Subjects data from Subjects.tsx
const subjectsData = [
  {
    name: "Mathematics",
    description: "From algebra to calculus, master any math topic with our expert tutors.",
    image: "https://images.unsplash.com/photo-1509228468518-180dd4864904",
    category: "STEM",
    tutorsCount: 12,
    popularTopics: JSON.stringify(["Algebra", "Calculus", "Geometry", "Trigonometry"]),
    difficulty: JSON.stringify(["Grade 10", "Grade 11", "Grade 12"]),
    order: 1
  },
  {
    name: "Physical Sciences",
    description: "Comprehensive physics and chemistry tutoring to help you excel in your studies.",
    image: "https://images.unsplash.com/photo-1532094349884-543bc11b234d",
    category: "STEM",
    tutorsCount: 8,
    popularTopics: JSON.stringify(["Mechanics", "Electricity", "Chemical Reactions", "Organic Chemistry"]),
    difficulty: JSON.stringify(["Grade 10", "Grade 11", "Grade 12"]),
    order: 2
  },
  {
    name: "Life Sciences",
    description: "Explore biology and related topics with our experienced life sciences tutors.",
    image: "https://images.unsplash.com/photo-1530210124550-912dc1381cb8",
    category: "STEM",
    tutorsCount: 6,
    popularTopics: JSON.stringify(["Cell Biology", "Genetics", "Human Physiology", "Ecology"]),
    difficulty: JSON.stringify(["Grade 10", "Grade 11", "Grade 12"]),
    order: 3
  },
  {
    name: "English",
    description: "Improve your language skills, essay writing, and literature analysis.",
    image: "https://images.unsplash.com/photo-1457369804613-52c61a468e7d",
    category: "Languages",
    tutorsCount: 10,
    popularTopics: JSON.stringify(["Grammar", "Essay Writing", "Literature", "Comprehension"]),
    difficulty: JSON.stringify(["Grade 10", "Grade 11", "Grade 12"]),
    order: 4
  },
  {
    name: "Afrikaans",
    description: "Master Afrikaans language skills with our dedicated language tutors.",
    image: "https://images.unsplash.com/photo-1544306094-e2dcf9479da3",
    category: "Languages",
    tutorsCount: 7,
    popularTopics: JSON.stringify(["Grammar", "Comprehension", "Literature", "Oral Skills"]),
    difficulty: JSON.stringify(["Grade 10", "Grade 11", "Grade 12"]),
    order: 5
  },
  {
    name: "Accounting",
    description: "Learn accounting principles, financial statements, and business calculations.",
    image: "https://images.unsplash.com/photo-1554224155-6726b3ff858f",
    category: "Commerce",
    tutorsCount: 9,
    popularTopics: JSON.stringify(["Financial Statements", "Cash Flow", "Inventory Valuation", "Companies"]),
    difficulty: JSON.stringify(["Grade 10", "Grade 11", "Grade 12"]),
    order: 6
  },
  {
    name: "Economics",
    description: "Understand economic principles, market dynamics, and financial systems.",
    image: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3",
    category: "Commerce",
    tutorsCount: 8,
    popularTopics: JSON.stringify(["Microeconomics", "Macroeconomics", "Economic Development", "Inflation"]),
    difficulty: JSON.stringify(["Grade 10", "Grade 11", "Grade 12"]),
    order: 7
  },
  {
    name: "Business Studies",
    description: "Master business concepts, entrepreneurship, and management principles.",
    image: "https://media.geeksforgeeks.org/wp-content/uploads/20230613172545/Commerce-Landing-page-copy.webp",
    category: "Commerce",
    tutorsCount: 7,
    popularTopics: JSON.stringify(["Entrepreneurship", "Business Ventures", "Business Roles", "Operations"]),
    difficulty: JSON.stringify(["Grade 10", "Grade 11", "Grade 12"]),
    order: 8
  },
  {
    name: "Geography",
    description: "Explore physical and human geography with our expert tutors.",
    image: "https://images.unsplash.com/photo-1519500099198-fd81846bc57f",
    category: "Humanities",
    tutorsCount: 5,
    popularTopics: JSON.stringify(["Climate", "Geomorphology", "Population", "Economic Geography"]),
    difficulty: JSON.stringify(["Grade 10", "Grade 11", "Grade 12"]),
    order: 9
  },
  {
    name: "History",
    description: "Discover historical events and develop critical analysis skills.",
    image: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570",
    category: "Humanities",
    tutorsCount: 4,
    popularTopics: JSON.stringify(["World Wars", "South African History", "Cold War", "Apartheid"]),
    difficulty: JSON.stringify(["Grade 10", "Grade 11", "Grade 12"]),
    order: 10
  }
]

// Footer content data
const footerContentData = {
  companyName: "EXCELLENCE Akademie 25",
  tagline: "Empowering Minds, One Click at a Time!",
  contactPhone: "+27 79 386 7427",
  contactEmail: "ExcellenceAcademia2025@gmail.com",
  contactPerson: "Roshan Singh",
  whatsappLink: "https://wa.me/27793867427",
  socialLinks: JSON.stringify({
    facebook: "https://facebook.com",
    twitter: "https://twitter.com",
    instagram: "https://www.instagram.com/excellence.academia25?igsh=eHAxMjJ0ZGVzbzk1",
    whatsapp: "https://wa.me/27793867427",
    tiktok: "https://www.tiktok.com/@excellence.academia25?_t=ZM-8tahfNmyA3a&_r=1"
  }),
  quickLinks: JSON.stringify([
    { path: "/about-us", label: "About Us" },
    { path: "/pricing", label: "Admissions" },
    { path: "/subjects", label: "Programs" },
    { path: "/university-application", label: "University Application" }
  ]),
  resourceLinks: JSON.stringify([
    { path: "/student-login", label: "Student Portal" },
    { path: "/tutor-login", label: "Tutor Portal" },
    { path: "/admin-login", label: "Admin Portal" },
    { path: "/exam-rewrite", label: "Exam Rewrite" },
    { path: "/become-tutor", label: "Become a Tutor" },
    { path: "/testimonials", label: "Testimonials" }
  ]),
  copyrightText: "© 2025 Excellence Academia. All rights reserved."
}

// Navigation items data
const navigationItemsData = [
  { path: "/", label: "Home", type: "main", order: 1 },
  { path: "/subjects", label: "Subjects", type: "main", order: 2 },
  { path: "/tutors", label: "Tutors", type: "main", order: 3 },
  { path: "/testimonials", label: "Testimonials", type: "main", order: 4 },
  { path: "/university-application", label: "University Application", type: "main", order: 5 },
  { path: "/exam-rewrite", label: "Check Offer !", type: "main", order: 6 },
  { path: "/contact-us", label: "Contact", type: "main", order: 7 },
  { path: "/about-us", label: "About Us", type: "main", order: 8 },
  { path: "/student-login", label: "Student Portal", type: "mobile", order: 1 },
  { path: "/tutor-login", label: "Tutor Portal", type: "mobile", order: 2 },
  { path: "/admin/login", label: "Admin", type: "mobile", order: 3 }
]

// Contact Us content data
const contactUsContentData = {
  title: "Contact Us",
  description: "Have any questions or feedback? Fill out the form below and we'll get back to you as soon as possible.",
  logo: "https://i.imgur.com/mrQ0rDu.png",
  formEndpoint: "https://formspree.io/f/xrbeqgqe",
  contactInfo: JSON.stringify({
    phone: "+27 79 386 7427",
    email: "ExcellenceAcademia2025@gmail.com",
    address: "South Africa",
    hours: "Monday - Friday: 8:00 AM - 6:00 PM"
  })
}

// Become Tutor content data
const becomeTutorContentData = {
  title: "Become a Tutor",
  description: "Join our team of exceptional educators and help students achieve their academic goals.",
  requirements: JSON.stringify([
    "Bachelor's degree or higher",
    "Teaching experience preferred",
    "Strong subject knowledge",
    "Excellent communication skills",
    "Passion for education"
  ]),
  benefits: JSON.stringify([
    "Flexible working hours",
    "Competitive compensation",
    "Professional development",
    "Supportive community",
    "Make a difference"
  ]),
  applicationUrl: "https://forms.app/6798e6f5f155c70002152541",
  formEmbedCode: `<script src="https://forms.app/static/embed.js"></script>`
}

// Exam Rewrite content data
const examRewriteContentData = {
  title: "Exam Rewrite Program",
  description: "Transform your academic future with our comprehensive exam rewrite program",
  heroTitle: "Second Chances, First-Class Results",
  heroDescription: "Don't let one exam define your future. Our expert tutors will help you achieve the grades you deserve.",
  benefits: JSON.stringify([
    "Expert tutoring in all subjects",
    "Personalized study plans",
    "Practice exams and mock tests",
    "Flexible scheduling",
    "Proven success rate"
  ]),
  process: JSON.stringify([
    { title: "Assessment", description: "We evaluate your current knowledge and identify areas for improvement" },
    { title: "Planning", description: "Create a personalized study plan tailored to your needs" },
    { title: "Learning", description: "Work with expert tutors to master the content" },
    { title: "Practice", description: "Take practice exams to build confidence" },
    { title: "Success", description: "Achieve the grades you need for your future" }
  ]),
  subjects: JSON.stringify([
    "Mathematics",
    "Physical Sciences",
    "Life Sciences",
    "English",
    "Afrikaans",
    "Accounting",
    "Economics",
    "Business Studies",
    "Geography",
    "History"
  ]),
  applicationFormUrl: "https://docs.google.com/forms/d/e/1FAIpQLScZUhGQsFhbgqLRdZ3PrZwr64pBIBgxKyY8EyQSE4REUxwWeA/viewform",
  grade11FormUrl: "",
  grade12FormUrl: "",
  pricingInfo: JSON.stringify({
    basic: { price: "R 150", period: "Monthly", subjects: 3 },
    standard: { price: "R 250", period: "Monthly", subjects: 5 },
    premium: { price: "R 350", period: "Monthly", subjects: "Unlimited" }
  })
}

async function migrateAllContent() {
  console.log('Starting comprehensive content migration...')

  try {
    // Migrate Tutors
    console.log('Migrating tutors...')
    for (const tutor of tutorsData) {
      await prisma.tutor.create({
        data: tutor
      })
    }

    // Migrate Subjects
    console.log('Migrating subjects...')
    for (const subject of subjectsData) {
      await prisma.subject.create({
        data: subject
      })
    }

    // Migrate Footer Content
    console.log('Migrating footer content...')
    await prisma.footerContent.create({
      data: footerContentData
    })

    // Migrate Navigation Items
    console.log('Migrating navigation items...')
    for (const navItem of navigationItemsData) {
      await prisma.navigationItem.create({
        data: navItem
      })
    }

    // Migrate Contact Us Content
    console.log('Migrating contact us content...')
    await prisma.contactUsContent.create({
      data: contactUsContentData
    })

    // Migrate Become Tutor Content
    console.log('Migrating become tutor content...')
    await prisma.becomeTutorContent.create({
      data: becomeTutorContentData
    })

    // Migrate Exam Rewrite Content
    console.log('Migrating exam rewrite content...')
    await prisma.examRewriteContent.create({
      data: examRewriteContentData
    })

    console.log('All content migration completed successfully!')
    
  } catch (error) {
    console.error('Error during comprehensive content migration:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run the migration if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  migrateAllContent()
    .then(() => {
      console.log('Comprehensive migration finished successfully')
      process.exit(0)
    })
    .catch((error) => {
      console.error('Comprehensive migration failed:', error)
      process.exit(1)
    })
}

export default migrateAllContent
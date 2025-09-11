import prisma from '../lib/prisma'

// Updated tutors data with new additions
const tutorsData = [
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
    order: 1
  },
  {
    name: "Mr Smooth-Accountant",
    subjects: JSON.stringify(["Accounting", "Economics", "Business"]),
    image: "https://i.imgur.com/Nsa0PWv.jpeg",
    contactName: "Mr. Smooth",
    contactPhone: "+27 63 416 1147",
    contactEmail: "ExcellenceAcademia2025@gmail.com",
    description: "Mr. Smooth specializes in accounting and business studies, providing real-world insights that bridge the gap between theory and practice.",
    ratings: JSON.stringify([
      {
        id: 1,
        studentName: "James P.",
        rating: 5,
        comment: "Best accounting teacher I've ever had!",
        date: "2025-03-22"
      }
    ]),
    order: 2
  },
  {
    name: "Amanda (Miss Penguin)",
    subjects: JSON.stringify(["Life Science", "Physical Science", "Geography", "English"]),
    image: "https://i.imgur.com/WW80efP.jpeg",
    contactName: "Amanda Utembe",
    contactPhone: "+27 62 950 7687",
    contactEmail: "ExcellenceAcademia2025@gmail.com",
    description: "Amanda, also known as Miss Penguin, brings her expertise in life science, physical science, geography, and English. She strives to make learning both informative and fun.",
    ratings: JSON.stringify([
      {
        id: 1,
        studentName: "Nomsa K.",
        rating: 5,
        comment: "Miss Penguin makes science fun and easy to understand!",
        date: "2025-03-18"
      },
      {
        id: 2,
        studentName: "Peter L.",
        rating: 4,
        comment: "Great teacher with creative teaching methods.",
        date: "2025-02-25"
      }
    ]),
    order: 3
  },
  {
    name: "Miss K",
    subjects: JSON.stringify(["Accounting", "English", "Physical Science"]),
    image: "https://i.imgur.com/grXHk5O.jpeg",
    contactName: "Miss K",
    contactPhone: "+27 83 520 7064",
    contactEmail: "ExcellenceAcademia2025@gmail.com",
    description: "Miss K specializes in accounting, English, and physical science. She is dedicated to helping students excel in these subjects with clarity and confidence.",
    ratings: JSON.stringify([
      {
        id: 1,
        studentName: "Tumi S.",
        rating: 4,
        comment: "Miss K is very patient and explains concepts clearly.",
        date: "2025-03-12"
      }
    ]),
    order: 4
  },
  {
    name: "Jacob",
    subjects: JSON.stringify(["Tourism", "English", "CAT", "Maths"]),
    image: "https://i.imgur.com/SwZblK8.jpeg",
    contactName: "Jacob",
    contactPhone: "+27 71 683 5713",
    contactEmail: "ExcellenceAcademia2025@gmail.com",
    description: "Jacob specializes in tourism, English, CAT, and maths. He is dedicated to ensuring his students understand key concepts in an engaging and approachable way.",
    ratings: JSON.stringify([
      {
        id: 1,
        studentName: "Sipho N.",
        rating: 5,
        comment: "Jacob is an excellent CAT teacher. Very knowledgeable!",
        date: "2025-03-08"
      }
    ]),
    order: 5
  },
  {
    name: "Miss Keturah",
    subjects: JSON.stringify(["Life Sciences", "Physical Sciences", "Mathematics"]),
    image: "https://media-hosting.imagekit.io/ead232ae99dd4dc2/WhatsApp%20Image%202025-04-02%20at%2018.40.37_2e9a0094.jpg?Expires=1838456745&Key-Pair-Id=K2ZIVPTIP2VGHC&Signature=2GQwXVeBJ~2FqX3DA66OMXmKnzbh6LtLZeAsSVlbpXCSvE5u-KrFryvFGerhsw~tZZoXkhhaIa1eH-N7W0dbLWMoD7HF3mRx1Z0LfbcbkzHIp1bdEFMeEQ6Rb2hOWOIj37HugVCKXsyRCilCkFGSscSFF0~RnjCT6oX0dkfE1yRcM8AISo7PGibOFlzq8CbUvRrdtATM227iQhmkL51uxvT5beKcnt24rIyN62aHy7iaD1qWltwSt1MTZJNbL4X440ehX0XP34YYfbWJxrv04YbM14a0g6SsKnNFfmofW2yKj8NWGcmNqaqzmg~VdQJvVFWH~CBVva2XEz89PIM9hA__",
    contactName: "Miss Keturah",
    contactPhone: "083 669 4983",
    contactEmail: "ExcellenceAcademia2025@gmail.com",
    description: "Miss Keturah is dedicated to teaching Life Sciences, Physical Sciences, and Mathematics. She focuses on fostering deep understanding and academic excellence in her students.",
    ratings: JSON.stringify([
      {
        id: 1,
        studentName: "Thandi K.",
        rating: 5,
        comment: "Miss Keturah is an amazing science teacher!",
        date: "2025-03-20"
      }
    ]),
    order: 6
  },
  {
    name: "Unobuhle",
    subjects: JSON.stringify(["Math Literacy"]),
    image: "https://used-bronze-nnmiofy2ws.edgeone.app/78701011-63ce-4bf9-af08-8a1b8f1854bf.jpeg",
    contactName: "Unobuhle",
    contactPhone: "+27 XXX XXX XXXX",
    contactEmail: "ExcellenceAcademia2025@gmail.com",
    description: "Unobuhle specializes in Math Literacy. She is dedicated to helping students build confidence and understanding in mathematical concepts.",
    ratings: JSON.stringify([
      {
        id: 1,
        studentName: "Initial Rating",
        rating: 4,
        comment: "Excellent approach to making math literacy accessible.",
        date: "2025-09-10"
      }
    ]),
    order: 7
  },
  {
    name: "SIR/MR LOVERS",
    subjects: JSON.stringify(["English FAL", "Business Studies", "Economics"]),
    image: "https://postimg.cc/8fbvc2NN",
    contactName: "SIR/MR LOVERS",
    contactPhone: "+27 XXX XXX XXXX",
    contactEmail: "ExcellenceAcademia2025@gmail.com",
    description: "SIR/MR LOVERS brings expertise in English FAL, Business Studies, and Economics. He is passionate about helping students excel in language and business subjects.",
    ratings: JSON.stringify([
      {
        id: 1,
        studentName: "Initial Rating",
        rating: 4,
        comment: "Great teacher with strong knowledge in business and economics.",
        date: "2025-09-10"
      }
    ]),
    order: 8
  },
  {
    name: "E.A Abby",
    subjects: JSON.stringify(["History", "English HL", "English FAL"]),
    image: "https://favourite-white-hffiigk1ng.edgeone.app/f8461f6a-360d-48ab-a83f-5c5d9ddba9ea.jpeg",
    contactName: "E.A Abby",
    contactPhone: "+27 XXX XXX XXXX",
    contactEmail: "ExcellenceAcademia2025@gmail.com",
    description: "E.A Abby specializes in History, English Home Language, and English First Additional Language. She is dedicated to helping students develop critical thinking and language skills.",
    ratings: JSON.stringify([
      {
        id: 1,
        studentName: "Initial Rating",
        rating: 5,
        comment: "Excellent history and English teacher with engaging lessons.",
        date: "2025-09-10"
      }
    ]),
    order: 9
  },
  {
    name: "Rohan",
    subjects: JSON.stringify(["Mathematics", "English HL"]),
    image: "https://military-moccasin-evrpzkorak.edgeone.app/f5f4976d-112e-4a9f-abe2-fe1c9e69de3d.jpeg",
    contactName: "Rohan",
    contactPhone: "+27 XXX XXX XXXX",
    contactEmail: "ExcellenceAcademia2025@gmail.com",
    description: "Rohan is a dedicated Mathematics and English Home Language tutor. He focuses on building strong foundations in both analytical and language skills to help students excel.",
    ratings: JSON.stringify([
      {
        id: 1,
        studentName: "Initial Rating",
        rating: 5,
        comment: "Outstanding math and English tutor with clear explanations.",
        date: "2025-09-10"
      }
    ]),
    order: 10
  {
    name: "Simon",
    subjects: JSON.stringify(["Mathematics", "Physical Science"]),
    image: "",
    contactName: "Simon",
    contactPhone: "+27 XXX XXX XXXX",
    contactEmail: "ExcellenceAcademia2025@gmail.com",
    description: "Simon is a dedicated Mathematics and Phusical science  tutor. He focuses on building strong foundations in both analytical and physics understanding  skills to help students excel.",
    ratings: JSON.stringify([
      {
        id: 1,
        studentName: "Initial Rating",
        rating: 5,
        comment: "Outstanding math and science tutor with clear explanations.",
        date: "2025-09-10"
      }
    ]),
    order: 11

  }
]

// Subjects data from Subjects.tsx
const subjectsData = [
  {
    name: "Mathematics",
    description: "From algebra to calculus, master any math topic with our expert tutors.",
    image: "https://images.unsplash.com/photo-1509228468518-180dd4864904",
    category: "STEM",
    tutorsCount: 14, // Updated count to include new tutors
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
    tutorsCount: 13, // Updated count to include new tutors (HL and FAL)
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
    tutorsCount: 5, // Updated count to include E.A Abby
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
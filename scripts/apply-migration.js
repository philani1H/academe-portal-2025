import prisma from '../src/lib/prisma.ts'

// Hero content data from Hero.tsx
const heroContentData = {
  title: "Welcome to Excellence Akademie",
  subtitle: "25 Years of Academic Excellence",
  description: "Empowering South African students to reach their full potential through world-class education and personalized guidance",
  buttonText: "Choose a Plan",
  secondaryButtonText: "Become a Tutor",
  trustIndicatorText: "Trusted by over 10,000+ students across South Africa",
  universities: JSON.stringify(["UCT", "Wits", "UP", "UKZN", "Stellenbosch"]),
  features: JSON.stringify([
    {
      title: "Expert Instruction",
      description: "Learn from South Africa's finest educators with proven teaching methodologies",
      icon: "award"
    },
    {
      title: "Personalized Learning",
      description: "Adaptive curriculum tailored to your unique learning style and pace",
      icon: "users"
    },
    {
      title: "Success Guarantee",
      description: "Join thousands of students who improved their grades by 25% or more",
      icon: "star"
    }
  ]),
  backgroundGradient: "bg-gradient-to-br from-[#0B1340] via-[#1B264F] to-[#3A5199]"
}

// Features data from Features.tsx
const featuresData = [
  {
    title: "Comprehensive Curriculum",
    description: "Structured learning paths covering all essential topics and concepts required for academic success.",
    icon: "curriculum",
    benefits: JSON.stringify(["Complete subject coverage", "Aligned with national standards", "Regular updates"]),
    order: 1
  },
  {
    title: "Expert Tutors",
    description: "Learn from experienced and qualified tutors who are specialists in their respective fields.",
    icon: "tutors",
    benefits: JSON.stringify(["Qualified educators", "Subject matter experts", "Personalized teaching approaches"]),
    order: 2
  },
  {
    title: "Cost-Effective",
    description: "Quality education at competitive rates with flexible pricing options to suit different needs and budgets.",
    icon: "cost",
    benefits: JSON.stringify(["Affordable packages", "Group discounts", "Flexible payment options"]),
    order: 3
  },
  {
    title: "Better Focus",
    description: "Personalized attention and customized learning approaches tailored to each student's unique needs and learning style.",
    icon: "focus",
    benefits: JSON.stringify(["One-on-one sessions", "Customized learning plans", "Progress tracking"]),
    order: 4
  },
  {
    title: "Technology Integration",
    description: "Modern learning tools and platforms for an enhanced educational experience that prepares students for the digital age.",
    icon: "technology",
    benefits: JSON.stringify(["Interactive learning tools", "Digital resources", "Virtual classrooms"]),
    order: 5
  },
  {
    title: "Global Access",
    description: "Connect with tutors and learn from anywhere in the world, eliminating geographical barriers to quality education.",
    icon: "global",
    benefits: JSON.stringify(["Remote learning options", "Flexible scheduling", "International curriculum support"]),
    order: 6
  }
]

// Announcements data from Features.tsx
const announcementsData = [
  {
    title: "Welcome to Excellence Academia",
    content: "Greetings, Class of 2025! Welcome to Excellence Academia, your premier online tutoring centre dedicated to empowering learners through high-quality, personalised education.",
    type: "info",
    pinned: true,
    authorId: 1
  },
  {
    title: "New Tutoring Packages",
    content: "New Mathematics and Science tutoring packages now available! Limited spots remaining for the upcoming term.",
    type: "info",
    pinned: false,
    authorId: 1
  }
]

// Team members data from AboutUs.tsx
const teamMembersData = [
  {
    name: "Roshan",
    role: "Founder & CEO",
    bio: "Roshan is the visionary behind the platform, driving innovation and excellence.",
    image: "https://i.imgur.com/GqzI3ir.jpeg",
    order: 1
  },
  {
    name: "Michael Ashton",
    role: "Chief Administrative Officer (CAO)",
    bio: "Michael Ashton specializes in administrative excellence, with expertise in GEO, business, and economics tutoring.",
    image: "https://i.imgur.com/CntZolm.jpeg",
    order: 2
  },
  {
    name: "Rendani",
    role: "Marketing Team Director",
    bio: "Rendani leads our marketing initiatives, ensuring our message reaches and resonates with our target audience.",
    image: "https://i.imgur.com/WXSc1dB.jpeg",
    order: 3
  },
  {
    name: "Jacob",
    role: "Chief Technology Officer (CTO)",
    bio: "Jacob spearheads the technological advancements of the Excellence Academia 25 platform. With a strong background in software engineering and innovative technologies, he ensures the platform's scalability, security, and strategic alignment across diverse disciplines. Jacob is passionate about leveraging technology to create impactful educational solutions.",
    image: "https://i.imgur.com/SwZblK8.jpeg",
    order: 4
  },
  {
    name: "Miss K",
    role: "Head of Discipline",
    bio: "Miss K oversees the application of disciplinary procedures and supports the team's overall discipline management.",
    image: "https://i.imgur.com/grXHk5O.jpeg",
    order: 5
  }
]

// About Us content data
const aboutUsContentData = {
  goal: "Our goal is to connect students with the best tutors who can help them achieve academic success and reach their full potential.",
  mission: "Our mission is to provide accessible and personalized learning experiences by offering top-tier tutoring services in a variety of subjects, making education more effective and enjoyable for every student.",
  rolesResponsibilities: JSON.stringify({
    roles: [
      {
        title: "Chief Executive Officer (CEO)",
        responsibilities: [
          "Set the vision and strategic goals of the company.",
          "Develop and implement long-term business strategies.",
          "Make key decisions regarding operations, finances, and growth opportunities.",
          "Represent the company in public forums, including media, stakeholder meetings, and industry events."
        ]
      },
      {
        title: "Chief Administrative Officer (CAO)",
        responsibilities: [
          "Oversee human resources, financial management, facilities management, and compliance operations.",
          "Manage day-to-day administrative tasks to ensure operational efficiency.",
          "Establish and implement policies to maintain organizational compliance and governance."
        ]
      },
      {
        title: "Chief Technology Officer (CTO)",
        responsibilities: [
          "Develop and oversee the organization's technology strategy and solutions.",
          "Manage and maintain the company's technology infrastructure.",
          "Ensure technology initiatives align with the company's business goals.",
          "Stay informed of emerging technologies and integrate them when appropriate."
        ]
      },
      {
        title: "Shareholder",
        responsibilities: [
          "Hold a portion of the company's shares, entitling them to dividends and a claim on profits.",
          "Exercise voting rights to influence key company decisions.",
          "Maintain the ability to transfer or sell their shares under the conditions set by the company."
        ]
      },
      {
        title: "Non-Executive Director (NED)",
        responsibilities: [
          "Offer independent expertise and advice to the board.",
          "Assist in driving the company's success by providing oversight on key strategic decisions.",
          "Ensure the company adheres to best practices and governance principles."
        ]
      },
      {
        title: "Employee",
        responsibilities: [
          "Perform assigned tasks and duties as per their employment agreement.",
          "Abide by company policies and procedures.",
          "Report to their designated supervisor or manager."
        ]
      },
      {
        title: "Head of Discipline",
        responsibilities: [
          "Ensure disciplinary procedures and policies are consistently applied.",
          "Oversee employee behavior and performance in alignment with company standards.",
          "Provide guidance and corrective actions when necessary."
        ]
      }
    ],
    appendix: "This Appendix forms part of the agreement entered into on 3rd January 2025 by Excellence Akademie and the parties outlined below. All parties agree to fulfill their roles and responsibilities as outlined in this document."
  })
}

// Extended testimonials data
const testimonialsData = [
  {
    content: "My grades improved significantly after just a few sessions. The tutors are knowledgeable and patient. I went from struggling with mathematics to scoring an A in my final exam!",
    author: "Sarah M.",
    role: "Mathematics Student",
    subject: "Mathematics",
    improvement: "C to A",
    image: "/placeholder.svg?height=100&width=100",
    rating: 5,
    order: 1
  },
  {
    content: "The flexible scheduling made it easy to fit tutoring into my busy schedule. The tutors at Excellence Akademie truly care about your success and go the extra mile to ensure you understand the concepts.",
    author: "James R.",
    role: "Physics Student",
    subject: "Physics",
    improvement: "D to B+",
    image: "/placeholder.svg?height=100&width=100",
    rating: 5,
    order: 2
  },
  {
    content: "Excellence Akademie helped me prepare for my exams. The tutors are professional and supportive. Their exam preparation strategies were invaluable and helped me achieve results I never thought possible.",
    author: "Emily W.",
    role: "Language Student",
    subject: "English",
    improvement: "B- to A+",
    image: "/placeholder.svg?height=100&width=100",
    rating: 5,
    order: 3
  },
  {
    content: "I was struggling with Business Studies until I found Excellence Akademie. Their tutors explained complex concepts in a way that was easy to understand. My confidence has grown tremendously!",
    author: "Michael K.",
    role: "Business Student",
    subject: "Business Studies",
    improvement: "C to A-",
    image: "/placeholder.svg?height=100&width=100",
    rating: 5,
    order: 4
  },
  {
    content: "The chemistry tutoring sessions transformed my understanding completely. What seemed impossible before became crystal clear. I never thought I'd enjoy science, but now I'm considering it as a career path!",
    author: "Lisa P.",
    role: "Chemistry Student",
    subject: "Chemistry",
    improvement: "F to B+",
    image: "/placeholder.svg?height=100&width=100",
    rating: 5,
    order: 5
  },
  {
    content: "As an adult learner returning to education, I was nervous about keeping up. The tutors at Excellence Akademie made me feel comfortable and supported throughout my journey. Highly recommended!",
    author: "David T.",
    role: "Adult Learner",
    subject: "Accounting",
    improvement: "Beginner to B",
    image: "/placeholder.svg?height=100&width=100",
    rating: 5,
    order: 6
  },
  {
    content: "The online tutoring platform is fantastic! I could access help from anywhere, and the interactive tools made learning engaging. My essay writing skills improved dramatically in just two months.",
    author: "Rachel H.",
    role: "Literature Student",
    subject: "Literature",
    improvement: "C+ to A-",
    image: "/placeholder.svg?height=100&width=100",
    rating: 5,
    order: 7
  },
  {
    content: "I struggled with biology for years until I found Excellence Akademie. The visual aids and practical examples they used made complex topics easy to grasp. Now I'm pursuing a career in medicine!",
    author: "Alex C.",
    role: "Biology Student",
    subject: "Biology",
    improvement: "D+ to A",
    image: "/placeholder.svg?height=100&width=100",
    rating: 5,
    order: 8
  },
  {
    content: "The group study sessions were incredibly valuable. Learning alongside other students while having expert guidance created the perfect learning environment. My Spanish fluency improved rapidly!",
    author: "Maria S.",
    role: "Language Student",
    subject: "Spanish",
    improvement: "B to A+",
    image: "/placeholder.svg?height=100&width=100",
    rating: 5,
    order: 9
  },
  {
    content: "Preparing for university entrance exams was stressful, but Excellence Akademie made it manageable. Their structured approach and practice tests gave me the confidence I needed to succeed.",
    author: "Thomas L.",
    role: "University Prep Student",
    subject: "Multiple Subjects",
    improvement: "Average to Top 10%",
    image: "/placeholder.svg?height=100&width=100",
    rating: 5,
    order: 10
  },
  {
    content: "The computer science tutoring exceeded my expectations. From basic programming to advanced algorithms, they covered everything I needed. I landed my dream internship thanks to their guidance!",
    author: "Jennifer K.",
    role: "Computer Science Student",
    subject: "Computer Science",
    improvement: "C- to A",
    image: "/placeholder.svg?height=100&width=100",
    rating: 5,
    order: 11
  },
  {
    content: "History was always my weakest subject until I started with Excellence Akademie. Their storytelling approach made historical events come alive. I actually look forward to history class now!",
    author: "Marcus W.",
    role: "History Student",
    subject: "History",
    improvement: "D to B+",
    image: "/placeholder.svg?height=100&width=100",
    rating: 5,
    order: 12
  },
  {
    content: "The specialized exam preparation course was exactly what I needed for my professional certification. The tutors understood the exam format perfectly and helped me pass on my first attempt!",
    author: "Helen R.",
    role: "Professional Student",
    subject: "Project Management",
    improvement: "Failed to Certified",
    image: "/placeholder.svg?height=100&width=100",
    rating: 5,
    order: 13
  },
  {
    content: "As a parent, I was amazed by how quickly my daughter's attitude toward learning changed. The tutors don't just teach subjects; they inspire confidence and curiosity. Money well spent!",
    author: "Patricia N.",
    role: "Parent",
    subject: "Multiple Subjects",
    improvement: "C average to B+ average",
    image: "/placeholder.svg?height=100&width=100",
    rating: 5,
    order: 14
  },
  {
    content: "The psychology tutoring sessions were incredibly insightful. The tutor helped me understand complex theories and apply them practically. My research paper received the highest grade in the class!",
    author: "Daniel F.",
    role: "Psychology Student",
    subject: "Psychology",
    improvement: "B- to A+",
    image: "/placeholder.svg?height=100&width=100",
    rating: 5,
    order: 15
  }
]

// Subjects data from Subjects.tsx
const subjectsData = [
  {
    name: "Mathematics",
    description: "From algebra to calculus, master any math topic with our expert tutors.",
    image: "https://images.unsplash.com/photo-1509228468518-180dd4864904",
    category: "STEM",
    tutorsCount: 14,
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
    tutorsCount: 13,
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
    tutorsCount: 5,
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
  console.log('Starting content migration (excluding tutors and pricing plans)...')

  try {
    // Clear only the content tables we're migrating (NOT tutors or pricing plans)
    console.log('Clearing existing content tables...')
    await prisma.$transaction([
      prisma.navigationItem.deleteMany(),
      prisma.footerContent.deleteMany(),
      prisma.contactUsContent.deleteMany(),
      prisma.becomeTutorContent.deleteMany(),
      prisma.examRewriteContent.deleteMany(),
      prisma.subject.deleteMany(),
      prisma.siteSettings.deleteMany(),
      prisma.testimonial.deleteMany(),
      prisma.aboutUsContent.deleteMany(),
      prisma.teamMember.deleteMany(),
      prisma.announcement.deleteMany(),
      prisma.feature.deleteMany(),
      prisma.heroContent.deleteMany(),
    ])

    // Migrate Hero Content
    console.log('Migrating hero content...')
    await prisma.heroContent.create({
      data: { ...heroContentData, isActive: true }
    })
    console.log('✓ Migrated hero content')

    // Migrate Features
    console.log('Migrating features...')
    for (const feature of featuresData) {
      await prisma.feature.create({
        data: { ...feature, isActive: true }
      })
    }
    console.log(`✓ Migrated ${featuresData.length} features`)

    // Migrate Announcements
    console.log('Migrating announcements...')
    for (const announcement of announcementsData) {
      await prisma.announcement.create({
        data: { ...announcement }
      })
    }
    console.log(`✓ Migrated ${announcementsData.length} announcements`)

    // Migrate Team Members
    console.log('Migrating team members...')
    for (const member of teamMembersData) {
      await prisma.teamMember.create({
        data: { ...member, isActive: true }
      })
    }
    console.log(`✓ Migrated ${teamMembersData.length} team members`)

    // Migrate About Us Content
    console.log('Migrating about us content...')
    await prisma.aboutUsContent.create({
      data: { ...aboutUsContentData, isActive: true }
    })
    console.log('✓ Migrated about us content')

    // Migrate Testimonials
    console.log('Migrating testimonials...')
    for (const testimonial of testimonialsData) {
      await prisma.testimonial.create({
        data: { ...testimonial, isActive: true }
      })
    }
    console.log(`✓ Migrated ${testimonialsData.length} testimonials`)

    // Migrate Subjects
    console.log('Migrating subjects...')
    for (const subject of subjectsData) {
      await prisma.subject.create({
        data: { ...subject, isActive: true }
      })
    }
    console.log(`✓ Migrated ${subjectsData.length} subjects`)

    // Migrate Footer Content
    console.log('Migrating footer content...')
    await prisma.footerContent.create({
      data: { ...footerContentData, isActive: true }
    })
    console.log('✓ Migrated footer content')

    // Migrate Navigation Items
    console.log('Migrating navigation items...')
    for (const navItem of navigationItemsData) {
      await prisma.navigationItem.create({
        data: { ...navItem, isActive: true }
      })
    }
    console.log(`✓ Migrated ${navigationItemsData.length} navigation items`)

    // Migrate Contact Us Content
    console.log('Migrating contact us content...')
    await prisma.contactUsContent.create({
      data: { ...contactUsContentData, isActive: true }
    })
    console.log('✓ Migrated contact us content')

    // Migrate Become Tutor Content
    console.log('Migrating become tutor content...')
    await prisma.becomeTutorContent.create({
      data: { ...becomeTutorContentData, isActive: true }
    })
    console.log('✓ Migrated become tutor content')

    // Migrate Exam Rewrite Content
    console.log('Migrating exam rewrite content...')
    await prisma.examRewriteContent.create({
      data: { ...examRewriteContentData, isActive: true }
    })
    console.log('✓ Migrated exam rewrite content')

    // Create site settings
    console.log('Creating site settings...')
    const siteSettings = [
      {
        key: 'site_name',
        value: 'Excellence Akademie',
        type: 'string',
        label: 'Site Name',
        category: 'general'
      },
      {
        key: 'site_logo',
        value: 'https://i.imgur.com/mrQ0rDu.png',
        type: 'image',
        label: 'Site Logo',
        category: 'appearance'
      },
      {
        key: 'contact_email',
        value: 'ExcellenceAcademia2025@gmail.com',
        type: 'string',
        label: 'Contact Email',
        category: 'general'
      },
      {
        key: 'primary_color',
        value: '#1B264F',
        type: 'string',
        label: 'Primary Color',
        category: 'appearance'
      }
    ]

    for (const setting of siteSettings) {
      await prisma.siteSettings.create({
        data: setting
      })
    }
    console.log(`✓ Created ${siteSettings.length} site settings`)

    console.log('\n✅ All content migration completed successfully!')
    console.log('Note: Tutors and pricing plans were skipped as requested.')
    
  } catch (error) {
    console.error('❌ Error during content migration:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Always run the migration
migrateAllContent()
  .then(() => {
    console.log('\n🎉 Migration finished successfully')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n💥 Migration failed:', error)
    process.exit(1)
  })

export default migrateAllContent
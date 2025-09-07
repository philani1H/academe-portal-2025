import prisma from '../lib/prisma'

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
    content: "Greetings, Class of 2025! Welcome to Excellence Academia, your premier online tutoring centre dedicated to empowering learners through high-quality, personalised education.",
    type: "info",
    pinned: true
  },
  {
    content: "New Mathematics and Science tutoring packages now available! Limited spots remaining for the upcoming term.",
    type: "info",
    pinned: false
  }
]

// Pricing plans data from Pricing.tsx
const pricingPlansData = [
  {
    name: "GRADE 12 BASIC",
    price: "R 150",
    period: "Monthly",
    features: JSON.stringify([
      "Core subjects tutoring",
      "Basic study materials",
      "Online resources access",
      "Group tutoring sessions",
      "Weekly assessments"
    ]),
    notIncluded: JSON.stringify(["1-on-1 tutoring", "Advanced study materials", "Career guidance", "Exam techniques workshop"]),
    color: "blue",
    icon: "calendar",
    popular: false,
    order: 1
  },
  {
    name: "STANDARD",
    price: "R 250",
    period: "Monthly",
    features: JSON.stringify([
      "All subjects tutoring",
      "Comprehensive study guides",
      "Practice papers & solutions",
      "Monthly 1-on-1 sessions",
      "Progress tracking",
      "Exam preparation support"
    ]),
    notIncluded: JSON.stringify(["Career guidance", "Advanced exam techniques"]),
    color: "indigo",
    icon: "star",
    popular: true,
    order: 2
  },
  {
    name: "PREMIUM",
    price: "R 350",
    period: "Monthly",
    features: JSON.stringify([
      "All Standard features",
      "Weekly 1-on-1 sessions",
      "Career guidance & counseling",
      "Advanced exam techniques",
      "Priority support",
      "University application assistance"
    ]),
    notIncluded: JSON.stringify([]),
    color: "purple",
    icon: "award",
    popular: false,
    order: 3
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

// Sample testimonials data
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
  }
]

async function migrateContent() {
  console.log('Starting content migration...')

  try {
    // Migrate Hero Content
    console.log('Migrating hero content...')
    await prisma.heroContent.create({
      data: heroContentData
    })

    // Migrate Features
    console.log('Migrating features...')
    for (const feature of featuresData) {
      await prisma.feature.create({
        data: feature
      })
    }

    // Migrate Announcements
    console.log('Migrating announcements...')
    for (const announcement of announcementsData) {
      await prisma.announcement.create({
        data: announcement
      })
    }

    // Migrate Pricing Plans
    console.log('Migrating pricing plans...')
    for (const plan of pricingPlansData) {
      await prisma.pricingPlan.create({
        data: plan
      })
    }

    // Migrate Team Members
    console.log('Migrating team members...')
    for (const member of teamMembersData) {
      await prisma.teamMember.create({
        data: member
      })
    }

    // Migrate About Us Content
    console.log('Migrating about us content...')
    await prisma.aboutUsContent.create({
      data: aboutUsContentData
    })

    // Migrate Testimonials
    console.log('Migrating testimonials...')
    for (const testimonial of testimonialsData) {
      await prisma.testimonial.create({
        data: testimonial
      })
    }

    // Create some basic site settings
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
        value: 'info@excellenceakademie.com',
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

    console.log('Content migration completed successfully!')
    
  } catch (error) {
    console.error('Error during content migration:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run the migration if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  migrateContent()
    .then(() => {
      console.log('Migration finished successfully')
      process.exit(0)
    })
    .catch((error) => {
      console.error('Migration failed:', error)
      process.exit(1)
    })
}

export default migrateContent
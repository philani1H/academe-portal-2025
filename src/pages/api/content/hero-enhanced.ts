import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    switch (req.method) {
      case 'GET':
        return await getHeroContent(req, res);
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Hero content API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function getHeroContent(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Get the active hero content
    const heroContent = await prisma.heroContent.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' }
    });

    if (!heroContent) {
      // Return enhanced default content if none exists
      return res.status(200).json({
        id: 'default',
        title: 'Excellence in Education Starts Here',
        subtitle: 'Transform Your Learning Journey',
        description: 'Join thousands of successful students who have achieved their academic goals with our world-class tutoring services. Expert tutors, personalized learning, and proven results.',
        buttonText: 'Start Learning Today',
        secondaryButtonText: 'Explore Courses',
        trustIndicatorText: 'Trusted by 10,000+ Students',
        universities: [
          'Harvard University',
          'MIT',
          'Stanford University',
          'Oxford University',
          'Cambridge University',
          'Yale University'
        ],
        features: [
          {
            title: 'Expert Tutors',
            description: 'Learn from qualified professionals with years of experience',
            icon: 'GraduationCap'
          },
          {
            title: 'Personalized Learning',
            description: 'Customized study plans tailored to your learning style',
            icon: 'BookOpen'
          },
          {
            title: 'Proven Results',
            description: '95% of our students achieve their academic goals',
            icon: 'Award'
          },
          {
            title: 'Flexible Scheduling',
            description: 'Study at your own pace with flexible time slots',
            icon: 'Calendar'
          }
        ],
        backgroundGradient: 'from-blue-600 via-purple-600 to-indigo-600',
        statistics: {
          studentsHelped: 10000,
          successRate: 95,
          averageGradeImprovement: 25,
          tutorSatisfaction: 98
        },
        testimonials: [
          {
            name: 'Sarah Johnson',
            grade: 'Grade 12',
            content: 'Excellence Academia helped me improve my grades by 30% in just 3 months!',
            rating: 5
          },
          {
            name: 'Michael Chen',
            grade: 'University',
            content: 'The personalized approach and expert tutors made all the difference.',
            rating: 5
          }
        ]
      });
    }

    // Parse JSON fields
    const universities = JSON.parse(heroContent.universities || '[]');
    const features = JSON.parse(heroContent.features || '[]');

    // Enhanced response with additional data
    const enhancedContent = {
      id: heroContent.id,
      title: heroContent.title,
      subtitle: heroContent.subtitle,
      description: heroContent.description,
      buttonText: heroContent.buttonText,
      secondaryButtonText: heroContent.secondaryButtonText,
      trustIndicatorText: heroContent.trustIndicatorText,
      universities: universities,
      features: features,
      backgroundGradient: heroContent.backgroundGradient,
      statistics: {
        studentsHelped: 10000,
        successRate: 95,
        averageGradeImprovement: 25,
        tutorSatisfaction: 98
      },
      testimonials: [
        {
          name: 'Sarah Johnson',
          grade: 'Grade 12',
          content: 'Excellence Academia helped me improve my grades by 30% in just 3 months!',
          rating: 5
        },
        {
          name: 'Michael Chen',
          grade: 'University',
          content: 'The personalized approach and expert tutors made all the difference.',
          rating: 5
        }
      ],
      lastUpdated: heroContent.updatedAt.toISOString()
    };

    return res.status(200).json(enhancedContent);
  } catch (error) {
    console.error('Error fetching hero content:', error);
    return res.status(500).json({ error: 'Failed to fetch hero content' });
  }
}
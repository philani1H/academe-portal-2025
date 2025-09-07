import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    switch (req.method) {
      case 'GET':
        return await getFeaturesContent(req, res);
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Features content API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function getFeaturesContent(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Get all active features
    const features = await prisma.feature.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' }
    });

    if (features.length === 0) {
      // Return enhanced default features if none exist
      return res.status(200).json([
        {
          id: '1',
          title: 'Expert Tutors',
          description: 'Learn from qualified professionals with years of teaching experience and subject expertise.',
          icon: 'GraduationCap',
          benefits: [
            'Certified and experienced educators',
            'Subject matter experts',
            'Personalized teaching approach',
            'Continuous professional development'
          ],
          isActive: true,
          order: 1,
          statistics: {
            totalTutors: 150,
            averageExperience: 8,
            satisfactionRate: 98
          },
          testimonials: [
            {
              name: 'Dr. Sarah Wilson',
              subject: 'Mathematics',
              experience: '10 years',
              quote: 'I love helping students discover their potential in mathematics.'
            }
          ]
        },
        {
          id: '2',
          title: 'Personalized Learning',
          description: 'Customized study plans and learning paths tailored to your individual needs and learning style.',
          icon: 'BookOpen',
          benefits: [
            'Individual learning assessments',
            'Customized study plans',
            'Adaptive learning technology',
            'Progress tracking and analytics'
          ],
          isActive: true,
          order: 2,
          statistics: {
            personalizedPlans: 5000,
            averageImprovement: 35,
            completionRate: 92
          },
          testimonials: [
            {
              name: 'Learning Specialist',
              subject: 'Education',
              experience: '7 years',
              quote: 'Every student learns differently, and we adapt to their unique needs.'
            }
          ]
        },
        {
          id: '3',
          title: 'Proven Results',
          description: 'Our students consistently achieve outstanding academic results and reach their educational goals.',
          icon: 'Award',
          benefits: [
            '95% success rate',
            'Average grade improvement of 25%',
            'University acceptance rate of 98%',
            'Long-term academic success'
          ],
          isActive: true,
          order: 3,
          statistics: {
            successRate: 95,
            averageGradeImprovement: 25,
            universityAcceptance: 98
          },
          testimonials: [
            {
              name: 'Success Coach',
              subject: 'Academic Achievement',
              experience: '12 years',
              quote: 'We measure success not just by grades, but by lifelong learning skills.'
            }
          ]
        },
        {
          id: '4',
          title: 'Flexible Scheduling',
          description: 'Study at your own pace with flexible time slots that fit your busy schedule.',
          icon: 'Calendar',
          benefits: [
            '24/7 availability',
            'Flexible time slots',
            'Online and offline options',
            'Reschedule easily'
          ],
          isActive: true,
          order: 4,
          statistics: {
            availableSlots: 1000,
            averageResponseTime: 2,
            flexibilityRating: 99
          },
          testimonials: [
            {
              name: 'Schedule Coordinator',
              subject: 'Student Services',
              experience: '5 years',
              quote: 'We make learning accessible by fitting into your life, not the other way around.'
            }
          ]
        },
        {
          id: '5',
          title: 'Interactive Learning',
          description: 'Engaging, interactive lessons that make learning fun and effective.',
          icon: 'Users',
          benefits: [
            'Interactive whiteboards',
            'Real-time collaboration',
            'Multimedia resources',
            'Gamified learning elements'
          ],
          isActive: true,
          order: 5,
          statistics: {
            interactiveTools: 50,
            engagementRate: 94,
            retentionRate: 88
          },
          testimonials: [
            {
              name: 'Interactive Learning Specialist',
              subject: 'Educational Technology',
              experience: '6 years',
              quote: 'Learning should be engaging and interactive to maximize retention.'
            }
          ]
        },
        {
          id: '6',
          title: '24/7 Support',
          description: 'Round-the-clock support to help you succeed in your academic journey.',
          icon: 'MessageSquare',
          benefits: [
            '24/7 student support',
            'Quick response times',
            'Multiple communication channels',
            'Comprehensive help resources'
          ],
          isActive: true,
          order: 6,
          statistics: {
            supportHours: 8760,
            averageResponseTime: 15,
            satisfactionRate: 96
          },
          testimonials: [
            {
              name: 'Support Specialist',
              subject: 'Student Services',
              experience: '4 years',
              quote: 'We are here whenever you need us, day or night.'
            }
          ]
        }
      ]);
    }

    // Enhance features with additional data
    const enhancedFeatures = features.map(feature => {
      const benefits = JSON.parse(feature.benefits || '[]');
      
      return {
        id: feature.id,
        title: feature.title,
        description: feature.description,
        icon: feature.icon,
        benefits: benefits,
        isActive: feature.isActive,
        order: feature.order,
        statistics: {
          totalTutors: 150,
          averageExperience: 8,
          satisfactionRate: 98
        },
        testimonials: [
          {
            name: 'Expert Tutor',
            subject: feature.title,
            experience: '5+ years',
            quote: `We excel in ${feature.title.toLowerCase()} and help students achieve their goals.`
          }
        ],
        lastUpdated: feature.updatedAt.toISOString()
      };
    });

    return res.status(200).json(enhancedFeatures);
  } catch (error) {
    console.error('Error fetching features content:', error);
    return res.status(500).json({ error: 'Failed to fetch features content' });
  }
}
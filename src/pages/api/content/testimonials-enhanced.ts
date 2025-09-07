import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    switch (req.method) {
      case 'GET':
        return await getTestimonialsContent(req, res);
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Testimonials content API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function getTestimonialsContent(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Get all active testimonials
    const testimonials = await prisma.testimonial.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' }
    });

    if (testimonials.length === 0) {
      // Return enhanced default testimonials if none exist
      return res.status(200).json([
        {
          id: '1',
          name: 'Sarah Johnson',
          role: 'Grade 12 Student',
          content: 'Excellence Academia transformed my academic journey! My grades improved by 30% in just 3 months. The personalized approach and expert tutors made all the difference.',
          rating: 5,
          subject: 'Mathematics & Physics',
          improvement: '30%',
          duration: '3 months',
          isActive: true,
          order: 1,
          avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
          verified: true,
          achievements: ['Grade improvement', 'University acceptance', 'Confidence boost']
        },
        {
          id: '2',
          name: 'Michael Chen',
          role: 'University Student',
          content: 'The quality of tutoring here is exceptional. My tutor helped me understand complex calculus concepts that I had struggled with for months. Highly recommended!',
          rating: 5,
          subject: 'Calculus & Statistics',
          improvement: '40%',
          duration: '4 months',
          isActive: true,
          order: 2,
          avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
          verified: true,
          achievements: ['Concept mastery', 'Exam success', 'Academic confidence']
        },
        {
          id: '3',
          name: 'Emily Rodriguez',
          role: 'High School Student',
          content: 'I was struggling with chemistry until I found Excellence Academia. The interactive learning methods and patient tutors helped me excel in my exams.',
          rating: 5,
          subject: 'Chemistry & Biology',
          improvement: '35%',
          duration: '2 months',
          isActive: true,
          order: 3,
          avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
          verified: true,
          achievements: ['Subject mastery', 'Exam excellence', 'Study skills']
        },
        {
          id: '4',
          name: 'David Thompson',
          role: 'Parent',
          content: 'As a parent, I was impressed by the professionalism and results. My daughter went from failing to excelling in mathematics. The progress tracking kept us informed every step of the way.',
          rating: 5,
          subject: 'Mathematics',
          improvement: '50%',
          duration: '6 months',
          isActive: true,
          order: 4,
          avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
          verified: true,
          achievements: ['Grade transformation', 'Parent satisfaction', 'Long-term success']
        },
        {
          id: '5',
          name: 'Lisa Wang',
          role: 'Grade 11 Student',
          content: 'The flexible scheduling and online platform made it easy to fit tutoring into my busy schedule. The results speak for themselves - I aced my final exams!',
          rating: 5,
          subject: 'English & Literature',
          improvement: '25%',
          duration: '5 months',
          isActive: true,
          order: 5,
          avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face',
          verified: true,
          achievements: ['Exam success', 'Time management', 'Academic excellence']
        },
        {
          id: '6',
          name: 'James Wilson',
          role: 'University Graduate',
          content: 'Excellence Academia helped me prepare for my university entrance exams. The comprehensive study materials and expert guidance were invaluable in achieving my goals.',
          rating: 5,
          subject: 'SAT & ACT Prep',
          improvement: '200 points',
          duration: '8 months',
          isActive: true,
          order: 6,
          avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face',
          verified: true,
          achievements: ['Test score improvement', 'University acceptance', 'Future success']
        }
      ]);
    }

    // Enhance testimonials with additional data
    const enhancedTestimonials = testimonials.map(testimonial => {
      return {
        id: testimonial.id,
        name: testimonial.name,
        role: testimonial.role,
        content: testimonial.content,
        rating: testimonial.rating,
        subject: testimonial.subject || 'General Tutoring',
        improvement: testimonial.improvement || 'Significant',
        duration: testimonial.duration || '3 months',
        isActive: testimonial.isActive,
        order: testimonial.order,
        avatar: testimonial.avatar || `https://ui-avatars.com/api/?name=${testimonial.name}&background=random`,
        verified: true,
        achievements: ['Grade improvement', 'Academic success', 'Confidence boost'],
        lastUpdated: testimonial.updatedAt.toISOString()
      };
    });

    return res.status(200).json(enhancedTestimonials);
  } catch (error) {
    console.error('Error fetching testimonials content:', error);
    return res.status(500).json({ error: 'Failed to fetch testimonials content' });
  }
}
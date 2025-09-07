import { NextApiRequest, NextApiResponse } from 'next'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    // Get student ID from query or auth (mock for now)
    const studentId = req.query.studentId as string || 'student-1'

    // Generate mock achievements for demonstration
    const achievements = [
      {
        id: 'achievement-1',
        title: 'First Assignment',
        description: 'Completed your first assignment successfully',
        icon: 'FileText',
        date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(),
        category: 'academic' as const,
        points: 10,
        rarity: 'common' as const
      },
      {
        id: 'achievement-2',
        title: 'Perfect Score',
        description: 'Achieved a perfect score on a test',
        icon: 'Star',
        date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 25).toISOString(),
        category: 'academic' as const,
        points: 50,
        rarity: 'rare' as const
      },
      {
        id: 'achievement-3',
        title: 'Study Streak',
        description: 'Studied for 7 days in a row',
        icon: 'Zap',
        date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 20).toISOString(),
        category: 'participation' as const,
        points: 25,
        rarity: 'common' as const
      },
      {
        id: 'achievement-4',
        title: 'Course Completion',
        description: 'Completed your first course',
        icon: 'GraduationCap',
        date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15).toISOString(),
        category: 'milestone' as const,
        points: 100,
        rarity: 'epic' as const
      },
      {
        id: 'achievement-5',
        title: 'Grade Improvement',
        description: 'Improved your average grade by 15%',
        icon: 'TrendingUp',
        date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(),
        category: 'improvement' as const,
        points: 75,
        rarity: 'rare' as const
      },
      {
        id: 'achievement-6',
        title: 'Active Participant',
        description: 'Participated in 20+ class discussions',
        icon: 'MessageSquare',
        date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
        category: 'participation' as const,
        points: 30,
        rarity: 'common' as const
      },
      {
        id: 'achievement-7',
        title: 'Test Master',
        description: 'Scored 90% or higher on 5 consecutive tests',
        icon: 'Trophy',
        date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
        category: 'academic' as const,
        points: 150,
        rarity: 'legendary' as const
      },
      {
        id: 'achievement-8',
        title: 'Early Bird',
        description: 'Submitted 10 assignments before the due date',
        icon: 'Clock',
        date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1).toISOString(),
        category: 'participation' as const,
        points: 40,
        rarity: 'common' as const
      }
    ]

    res.status(200).json(achievements)
  } catch (error) {
    console.error('Error fetching student achievements:', error)
    res.status(500).json({ message: 'Internal server error' })
  } finally {
    await prisma.$disconnect()
  }
}
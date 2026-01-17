import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    switch (req.method) {
      case 'GET':
        return await getStudentTests(req, res);
      case 'POST':
        return await submitTest(req, res);
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Student tests API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function getStudentTests(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { studentId, courseId } = req.query;

    if (!studentId || typeof studentId !== 'string') {
      return res.status(400).json({ error: 'Student ID is required' });
    }

    // Get student's enrolled courses
    const enrollments = await prisma.courseEnrollment.findMany({
      where: { userId: studentId },
      include: {
        course: {
          include: {
            tests: {
              include: {
                questions: true,
                submissions: {
                  where: { userId: studentId }
                }
              }
            }
          }
        }
      }
    });

    let allTests = [];
    
    // Filter by course if specified
    if (courseId) {
      const enrollment = enrollments.find(e => e.courseId === courseId);
      if (enrollment) {
        allTests = enrollment.course.tests;
      }
    } else {
      // Get all tests from all enrolled courses
      allTests = enrollments.flatMap(enrollment => enrollment.course.tests);
    }

    const formattedTests = allTests.map(test => {
      const submission = test.submissions && test.submissions.length > 0 ? test.submissions[0] : null;
      
      return {
        id: test.id,
        title: test.title,
        courseId: test.courseId,
        courseName: enrollments.find(e => e.courseId === test.courseId)?.course.title || 'Unknown Course',
        description: 'Test covering key concepts from the course',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        questions: test.questions.map(q => ({
          id: q.id,
          question: q.question,
          options: JSON.parse(q.options || '[]'),
          answer: q.answer,
          type: 'multiple-choice'
        })),
        totalPoints: 100,
        timeLimit: 60, // minutes
        status: submission ? 'completed' : 'upcoming',
        score: submission ? submission.score : null,
        submittedAt: submission ? submission.createdAt.toISOString() : null,
        answers: submission ? JSON.parse(submission.answers || '{}') : null
      };
    });

    // Sort tests by due date
    formattedTests.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

    return res.status(200).json(formattedTests);
  } catch (error) {
    console.error('Error fetching student tests:', error);
    return res.status(500).json({ error: 'Failed to fetch tests' });
  }
}

async function submitTest(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { studentId, testId, answers } = req.body;

    if (!studentId || !testId || !answers) {
      return res.status(400).json({ error: 'Student ID, test ID, and answers are required' });
    }

    // Get test with questions
    const test = await prisma.test.findUnique({
      where: { id: testId },
      include: {
        questions: true
      }
    });

    if (!test) {
      return res.status(404).json({ error: 'Test not found' });
    }

    // Check if already submitted
    const existingSubmission = await prisma.testSubmission.findFirst({
      where: {
        userId: studentId,
        testId: testId
      }
    });

    if (existingSubmission) {
      return res.status(400).json({ error: 'Test already submitted' });
    }

    // Calculate score
    let correctAnswers = 0;
    const totalQuestions = test.questions.length;

    test.questions.forEach(question => {
      const studentAnswer = answers[question.id];
      if (studentAnswer === question.answer) {
        correctAnswers++;
      }
    });

    const score = (correctAnswers / totalQuestions) * 100;

    // Create submission
    const submission = await prisma.testSubmission.create({
      data: {
        userId: studentId,
        testId: testId,
        answers: JSON.stringify(answers),
        score: score
      }
    });

    return res.status(201).json({
      message: 'Test submitted successfully',
      submission: {
        id: submission.id,
        score: score,
        correctAnswers,
        totalQuestions,
        submittedAt: submission.createdAt.toISOString()
      }
    });
  } catch (error) {
    console.error('Error submitting test:', error);
    return res.status(500).json({ error: 'Failed to submit test' });
  }
}
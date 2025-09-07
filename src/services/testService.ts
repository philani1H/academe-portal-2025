import { executeQuery } from '../lib/db';

export interface Test {
  id: string;
  course_id: string;
  title: string;
  description: string;
  due_date: string;
  time_limit?: number;
  total_points: number;
  status: 'upcoming' | 'in-progress' | 'completed' | 'missed';
  created_at: string;
  updated_at: string;
}

export interface TestQuestion {
  id: string;
  test_id: string;
  text: string;
  type: 'multiple-choice' | 'true-false' | 'short-answer' | 'essay';
  options?: string[];
  correct_answer?: string | string[];
  points: number;
  order: number;
}

export interface TestSubmission {
  id: string;
  test_id: string;
  student_id: string;
  answers: Record<string, string | string[]>;
  score?: number;
  submitted_at: string;
  graded_at?: string;
  feedback?: string;
}

// Get all tests for a course
export async function getTestsByCourseId(courseId: string): Promise<Test[]> {
  try {
    return await executeQuery<Test[]>(
      'SELECT * FROM tests WHERE course_id = ? ORDER BY created_at DESC',
      [courseId]
    );
  } catch (error) {
    console.error('Error getting tests by course ID:', error);
    throw error;
  }
}

// Get test details including questions
export async function getTestById(testId: string): Promise<{ test: Test; questions: TestQuestion[] }> {
  try {
    const tests = await executeQuery<Test[]>(
      'SELECT * FROM tests WHERE id = ?',
      [testId]
    );
    
    if (!tests || tests.length === 0) {
      throw new Error('Test not found');
    }
    
    const questions = await executeQuery<TestQuestion[]>(
      'SELECT * FROM test_questions WHERE test_id = ? ORDER BY `order` ASC',
      [testId]
    );
    
    return { test: tests[0], questions: questions || [] };
  } catch (error) {
    console.error('Error getting test by ID:', error);
    throw error;
  }
}

// Create a new test
export async function createTest(test: Omit<Test, 'id' | 'created_at' | 'updated_at'>): Promise<Test> {
  try {
    const now = new Date().toISOString();
    const result = await executeQuery<{insertId: string}>(
      'INSERT INTO tests (course_id, title, description, due_date, time_limit, total_points, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [test.course_id, test.title, test.description, test.due_date, test.time_limit, test.total_points, test.status, now, now]
    );
    
    return await getTestById(result.insertId).then(res => res.test);
  } catch (error) {
    console.error('Error creating test:', error);
    throw error;
  }
}

// Add questions to a test
export async function addTestQuestions(questions: Omit<TestQuestion, 'id'>[]): Promise<TestQuestion[]> {
  try {
    if (!questions.length) return [];
    
    const placeholders = questions.map(() => '(?, ?, ?, ?, ?, ?, ?)').join(', ');
    const values = questions.flatMap(q => [
      q.test_id, 
      q.text, 
      q.type, 
      JSON.stringify(q.options || []), 
      JSON.stringify(q.correct_answer || ''), 
      q.points, 
      q.order
    ]);
    
    await executeQuery(
      `INSERT INTO test_questions (test_id, text, type, options, correct_answer, points, \`order\`) VALUES ${placeholders}`,
      values
    );
    
    return await executeQuery<TestQuestion[]>(
      'SELECT * FROM test_questions WHERE test_id = ? ORDER BY `order` ASC',
      [questions[0].test_id]
    );
  } catch (error) {
    console.error('Error adding test questions:', error);
    throw error;
  }
}

// Submit test answers
export async function submitTest(submission: Omit<TestSubmission, 'id' | 'submitted_at' | 'score'>): Promise<TestSubmission> {
  try {
    const now = new Date().toISOString();
    const result = await executeQuery<{insertId: string}>(
      'INSERT INTO test_submissions (test_id, student_id, answers, submitted_at) VALUES (?, ?, ?, ?)',
      [submission.test_id, submission.student_id, JSON.stringify(submission.answers), now]
    );
    
    const submissions = await executeQuery<TestSubmission[]>(
      'SELECT * FROM test_submissions WHERE id = ?',
      [result.insertId]
    );
    
    return submissions[0];
  } catch (error) {
    console.error('Error submitting test:', error);
    throw error;
  }
}

// Grade a test submission
export async function gradeTestSubmission(submissionId: string, score: number, feedback?: string): Promise<TestSubmission> {
  try {
    const now = new Date().toISOString();
    await executeQuery(
      'UPDATE test_submissions SET score = ?, feedback = ?, graded_at = ? WHERE id = ?',
      [score, feedback || null, now, submissionId]
    );
    
    const submissions = await executeQuery<TestSubmission[]>(
      'SELECT * FROM test_submissions WHERE id = ?',
      [submissionId]
    );
    
    return submissions[0];
  } catch (error) {
    console.error('Error grading test submission:', error);
    throw error;
  }
}
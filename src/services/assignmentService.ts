import { executeQuery } from '../lib/db';

export interface Assignment {
  id: string;
  course_id: string;
  title: string;
  description: string;
  due_date: string;
  total_points: number;
  status: 'pending' | 'submitted' | 'graded';
  created_at: string;
  updated_at: string;
  attachments?: string[];
}

export interface AssignmentSubmission {
  id: string;
  assignment_id: string;
  student_id: string;
  content: string;
  attachments?: string[];
  score?: number;
  feedback?: string;
  submitted_at: string;
  graded_at?: string;
}

// Get all assignments for a course
export async function getAssignmentsByCourseId(courseId: string): Promise<Assignment[]> {
  try {
    return await executeQuery<Assignment[]>(
      'SELECT * FROM assignments WHERE course_id = ? ORDER BY due_date ASC',
      [courseId]
    );
  } catch (error) {
    console.error('Error getting assignments by course ID:', error);
    throw error;
  }
}

// Get assignment details
export async function getAssignmentById(assignmentId: string): Promise<Assignment> {
  try {
    const assignments = await executeQuery<Assignment[]>(
      'SELECT * FROM assignments WHERE id = ?',
      [assignmentId]
    );
    
    if (!assignments || assignments.length === 0) {
      throw new Error('Assignment not found');
    }
    
    return assignments[0];
  } catch (error) {
    console.error('Error getting assignment by ID:', error);
    throw error;
  }
}

// Create a new assignment
export async function createAssignment(assignment: Omit<Assignment, 'id' | 'created_at' | 'updated_at'>): Promise<Assignment> {
  try {
    const now = new Date().toISOString();
    const attachmentsJson = assignment.attachments ? JSON.stringify(assignment.attachments) : null;
    
    const result = await executeQuery<{insertId: string}>(
      'INSERT INTO assignments (course_id, title, description, due_date, total_points, status, attachments, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [assignment.course_id, assignment.title, assignment.description, assignment.due_date, assignment.total_points, assignment.status, attachmentsJson, now, now]
    );
    
    return await getAssignmentById(result.insertId);
  } catch (error) {
    console.error('Error creating assignment:', error);
    throw error;
  }
}

// Update an assignment
export async function updateAssignment(assignmentId: string, updates: Partial<Assignment>): Promise<Assignment> {
  try {
    const now = new Date().toISOString();
    const assignment = await getAssignmentById(assignmentId);
    
    // Prepare update fields and values
    const updateFields = [];
    const updateValues = [];
    
    if (updates.title !== undefined) {
      updateFields.push('title = ?');
      updateValues.push(updates.title);
    }
    
    if (updates.description !== undefined) {
      updateFields.push('description = ?');
      updateValues.push(updates.description);
    }
    
    if (updates.due_date !== undefined) {
      updateFields.push('due_date = ?');
      updateValues.push(updates.due_date);
    }
    
    if (updates.total_points !== undefined) {
      updateFields.push('total_points = ?');
      updateValues.push(updates.total_points);
    }
    
    if (updates.status !== undefined) {
      updateFields.push('status = ?');
      updateValues.push(updates.status);
    }
    
    if (updates.attachments !== undefined) {
      updateFields.push('attachments = ?');
      updateValues.push(JSON.stringify(updates.attachments));
    }
    
    // Add updated_at field
    updateFields.push('updated_at = ?');
    updateValues.push(now);
    
    // Add assignmentId to values array
    updateValues.push(assignmentId);
    
    await executeQuery(
      `UPDATE assignments SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );
    
    return await getAssignmentById(assignmentId);
  } catch (error) {
    console.error('Error updating assignment:', error);
    throw error;
  }
}

// Submit an assignment
export async function submitAssignment(submission: Omit<AssignmentSubmission, 'id' | 'submitted_at'>): Promise<AssignmentSubmission> {
  try {
    const now = new Date().toISOString();
    const attachmentsJson = submission.attachments ? JSON.stringify(submission.attachments) : null;
    
    const result = await executeQuery<{insertId: string}>(
      'INSERT INTO assignment_submissions (assignment_id, student_id, content, attachments, submitted_at) VALUES (?, ?, ?, ?, ?)',
      [submission.assignment_id, submission.student_id, submission.content, attachmentsJson, now]
    );
    
    const submissions = await executeQuery<AssignmentSubmission[]>(
      'SELECT * FROM assignment_submissions WHERE id = ?',
      [result.insertId]
    );
    
    return submissions[0];
  } catch (error) {
    console.error('Error submitting assignment:', error);
    throw error;
  }
}

// Grade an assignment submission
export async function gradeAssignmentSubmission(
  submissionId: string,
  score: number,
  feedback?: string
): Promise<AssignmentSubmission> {
  try {
    const now = new Date().toISOString();
    
    await executeQuery(
      'UPDATE assignment_submissions SET score = ?, feedback = ?, graded_at = ? WHERE id = ?',
      [score, feedback || null, now, submissionId]
    );
    
    const submissions = await executeQuery<AssignmentSubmission[]>(
      'SELECT * FROM assignment_submissions WHERE id = ?',
      [submissionId]
    );
    
    return submissions[0];
  } catch (error) {
    console.error('Error grading assignment submission:', error);
    throw error;
  }
}

// Get student's assignment submissions
export async function getStudentAssignmentSubmissions(studentId: string, courseId?: string): Promise<AssignmentSubmission[]> {
  try {
    let query = 'SELECT s.*, a.* FROM assignment_submissions s JOIN assignments a ON s.assignment_id = a.id WHERE s.student_id = ?';
    const params = [studentId];
    
    if (courseId) {
      query += ' AND a.course_id = ?';
      params.push(courseId);
    }
    
    query += ' ORDER BY s.submitted_at DESC';
    
    return await executeQuery<AssignmentSubmission[]>(query, params);
  } catch (error) {
    console.error('Error getting student assignment submissions:', error);
    throw error;
  }
}
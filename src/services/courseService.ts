import { executeQuery } from '../lib/db';

export interface Course {
  id: string;
  name: string;
  description: string;
  department_id: string;
  tutor_id: string;
  status: 'active' | 'pending' | 'inactive';
  start_date: string;
  end_date: string;
  color: string;
  created_at: string;
}

export interface CourseEnrollment {
  id: string;
  course_id: string;
  student_id: string;
  enrollment_date: string;
  status: 'enrolled' | 'pending' | 'completed';
  progress: number;
  grade: number | null;
}

export interface CourseMaterial {
  id: string;
  course_id: string;
  title: string;
  description: string | null;
  type: 'pdf' | 'video' | 'document';
  url: string;
  size: string | null;
  created_at: string;
}

export async function getCourseById(id: string): Promise<Course | null> {
  try {
    const courses = await executeQuery<Course[]>(
      'SELECT * FROM courses WHERE id = ?',
      [id]
    );
    return courses[0] || null;
  } catch (error) {
    console.error('Error getting course:', error);
    throw error;
  }
}

export async function getCoursesByTutorId(tutorId: string): Promise<Course[]> {
  try {
    return await executeQuery<Course[]>(
      'SELECT * FROM courses WHERE tutor_id = ? ORDER BY created_at DESC',
      [tutorId]
    );
  } catch (error) {
    console.error('Error getting tutor courses:', error);
    throw error;
  }
}

export async function getEnrolledCourses(studentId: string): Promise<Course[]> {
  try {
    return await executeQuery<Course[]>(
      `SELECT c.* FROM courses c
       INNER JOIN course_enrollments e ON c.id = e.course_id
       WHERE e.student_id = ? AND e.status != 'pending'
       ORDER BY c.start_date DESC`,
      [studentId]
    );
  } catch (error) {
    console.error('Error getting enrolled courses:', error);
    throw error;
  }
}

export async function getCourseMaterials(courseId: string): Promise<CourseMaterial[]> {
  try {
    return await executeQuery<CourseMaterial[]>(
      'SELECT * FROM course_materials WHERE course_id = ? ORDER BY created_at DESC',
      [courseId]
    );
  } catch (error) {
    console.error('Error getting course materials:', error);
    throw error;
  }
}

export async function getCourseEnrollment(courseId: string, studentId: string): Promise<CourseEnrollment | null> {
  try {
    const enrollments = await executeQuery<CourseEnrollment[]>(
      'SELECT * FROM course_enrollments WHERE course_id = ? AND student_id = ?',
      [courseId, studentId]
    );
    return enrollments[0] || null;
  } catch (error) {
    console.error('Error getting course enrollment:', error);
    throw error;
  }
}

export async function updateCourseProgress(courseId: string, studentId: string, progress: number): Promise<void> {
  try {
    await executeQuery(
      'UPDATE course_enrollments SET progress = ? WHERE course_id = ? AND student_id = ?',
      [progress, courseId, studentId]
    );
  } catch (error) {
    console.error('Error updating course progress:', error);
    throw error;
  }
}
import { executeQuery } from '../lib/db';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'tutor' | 'student';
  status: 'active' | 'pending' | 'inactive' | 'rejected';
  created_at: string;
  last_active: string | null;
  avatar_url: string | null;
}

export interface TutorProfile {
  user_id: string;
  department_id: string;
  specialization: string;
  qualification: string;
  rating: number | null;
}

export interface StudentProfile {
  user_id: string;
  grade_level: number | null;
  parent_name: string | null;
  parent_contact: string | null;
}

export async function getUserById(id: string): Promise<User | null> {
  try {
    const users = await executeQuery<User[]>(
      'SELECT * FROM users WHERE id = ?',
      [id]
    );
    return users[0] || null;
  } catch (error) {
    console.error('Error getting user:', error);
    throw error;
  }
}

export async function getTutorProfile(userId: string): Promise<TutorProfile | null> {
  try {
    const profiles = await executeQuery<TutorProfile[]>(
      'SELECT * FROM tutor_profiles WHERE user_id = ?',
      [userId]
    );
    return profiles[0] || null;
  } catch (error) {
    console.error('Error getting tutor profile:', error);
    throw error;
  }
}

export async function getStudentProfile(userId: string): Promise<StudentProfile | null> {
  try {
    const profiles = await executeQuery<StudentProfile[]>(
      'SELECT * FROM student_profiles WHERE user_id = ?',
      [userId]
    );
    return profiles[0] || null;
  } catch (error) {
    console.error('Error getting student profile:', error);
    throw error;
  }
}

export async function updateUserLastActive(userId: string): Promise<void> {
  try {
    await executeQuery(
      'UPDATE users SET last_active = CURRENT_TIMESTAMP WHERE id = ?',
      [userId]
    );
  } catch (error) {
    console.error('Error updating user last active:', error);
    throw error;
  }
}
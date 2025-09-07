export interface User {
  id: string;
  email: string;
  name: string;
  role: 'student' | 'tutor' | 'admin';
  courses?: {
    id: string;
    name: string;
    progress?: number;
    lastUpdated?: string;
  }[];
}
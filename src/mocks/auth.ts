// Mock user data for testing
export const mockUsers = [
  {
    id: '1',
    email: 'admin@example.com',
    password: 'admin123',
    name: 'Admin User',
    role: 'admin'
  },
  {
    id: '2',
    email: 'tutor@example.com',
    password: 'tutor123',
    name: 'Tutor User',
    role: 'tutor'
  },
  {
    id: '3',
    email: 'student@example.com',
    password: 'student123',
    name: 'Student User',
    role: 'student',
    courses: [
      {
        id: '1',
        name: 'Mathematics 101',
        progress: 60,
        lastUpdated: new Date().toISOString()
      },
      {
        id: '2',
        name: 'Physics 101',
        progress: 30,
        lastUpdated: new Date().toISOString()
      }
    ]
  }
];

// Mock authentication functions
export const mockLogin = async (email: string, password: string) => {
  const user = mockUsers.find(u => u.email === email && u.password === password);
  if (!user) {
    throw new Error('Invalid credentials');
  }
  const { password: _, ...userWithoutPassword } = user;
  return userWithoutPassword;
};
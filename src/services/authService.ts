import { User } from './userService';
import { executeQuery } from './databaseService';

export interface AuthResponse {
  user: User;
  token: string;
  error?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export async function login(credentials: LoginCredentials): Promise<AuthResponse> {
  try {
    // In a real implementation, this would verify credentials against a hashed password
    const users = await executeQuery<User[]>(
      'SELECT * FROM users WHERE email = ?',
      [credentials.email]
    );

    if (!users.length) {
      throw new Error('Invalid credentials');
    }

    const user = users[0];
    
    // Update last active timestamp
    await executeQuery(
      'UPDATE users SET last_active = NOW() WHERE id = ?',
      [user.id]
    );

    // Generate JWT token (in a real implementation)
    const token = generateToken(user);

    return { user, token };
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
}

export async function logout(userId: string): Promise<void> {
  try {
    // Update last active timestamp
    await executeQuery(
      'UPDATE users SET last_active = NOW() WHERE id = ?',
      [userId]
    );
    // In a real implementation, this would also invalidate the JWT token
  } catch (error) {
    console.error('Logout error:', error);
    throw error;
  }
}

// Helper function to generate JWT token
function generateToken(user: User): string {
  // In a real implementation, this would use a JWT library
  return `mock_token_${user.id}`;
}

export async function verifyToken(token: string): Promise<User | null> {
  try {
    // In a real implementation, this would verify the JWT token
    const userId = token.replace('mock_token_', '');
    const users = await executeQuery<User[]>(
      'SELECT * FROM users WHERE id = ?',
      [userId]
    );
    return users[0] || null;
  } catch (error) {
    console.error('Token verification error:', error);
    return null;
  }
}
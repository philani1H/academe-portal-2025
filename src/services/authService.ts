import { apiFetch } from '@/lib/api'

export interface User {
  id: string
  name: string
  email: string
  role: 'admin' | 'tutor' | 'student'
  status: 'active' | 'pending' | 'inactive' | 'rejected'
  createdAt: string
  lastActive?: string
  department?: string
  specialization?: string
  avatar?: string
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterData {
  name: string
  email: string
  password: string
  role: 'tutor' | 'student'
  department?: string
  specialization?: string
}

export interface AuthResponse {
  user: User
  token: string
  message: string
}

class AuthService {
  private token: string | null = null
  private user: User | null = null

  constructor() {
    // Initialize from localStorage
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('auth_token')
      const userStr = localStorage.getItem('auth_user')
      if (userStr) {
        try {
          this.user = JSON.parse(userStr)
        } catch (error) {
          console.error('Error parsing user from localStorage:', error)
          this.clearAuth()
        }
      }
    }
  }

  // Login user
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response = await apiFetch<AuthResponse>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials)
      })

      this.setAuth(response.user, response.token)
      return response
    } catch (error) {
      console.error('Login error:', error)
      throw error
    }
  }

  // Register user
  async register(data: RegisterData): Promise<AuthResponse> {
    try {
      const response = await apiFetch<AuthResponse>('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(data)
      })

      this.setAuth(response.user, response.token)
      return response
    } catch (error) {
      console.error('Registration error:', error)
      throw error
    }
  }

  // Logout user
  async logout(): Promise<void> {
    try {
      if (this.token) {
        await apiFetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.token}`
          }
        })
      }
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      this.clearAuth()
    }
  }

  // Verify token
  async verifyToken(): Promise<User | null> {
    try {
      if (!this.token) return null

      const user = await apiFetch<User>('/api/auth/verify', {
        headers: {
          'Authorization': `Bearer ${this.token}`
        }
      })

      this.user = user
      this.saveAuth()
      return user
    } catch (error) {
      console.error('Token verification error:', error)
      this.clearAuth()
      return null
    }
  }

  // Set authentication data
  private setAuth(user: User, token: string): void {
    this.user = user
    this.token = token
    this.saveAuth()
  }

  // Save authentication data to localStorage
  private saveAuth(): void {
    if (typeof window !== 'undefined') {
      if (this.token) {
        localStorage.setItem('auth_token', this.token)
      }
      if (this.user) {
        localStorage.setItem('auth_user', JSON.stringify(this.user))
      }
    }
  }

  // Clear authentication data
  private clearAuth(): void {
    this.user = null
    this.token = null
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token')
      localStorage.removeItem('auth_user')
    }
  }

  // Get current user
  getCurrentUser(): User | null {
    return this.user
  }

  // Get current token
  getToken(): string | null {
    return this.token
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return !!(this.user && this.token)
  }

  // Check if user has specific role
  hasRole(role: string): boolean {
    return this.user?.role === role
  }

  // Check if user is admin
  isAdmin(): boolean {
    return this.hasRole('admin')
  }

  // Check if user is tutor
  isTutor(): boolean {
    return this.hasRole('tutor')
  }

  // Check if user is student
  isStudent(): boolean {
    return this.hasRole('student')
  }

  // Update user profile
  async updateProfile(data: Partial<User>): Promise<User> {
    try {
      const user = await apiFetch<User>('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${this.token}`
        },
        body: JSON.stringify(data)
      })

      this.user = user
      this.saveAuth()
      return user
    } catch (error) {
      console.error('Profile update error:', error)
      throw error
    }
  }

  // Change password
  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    try {
      await apiFetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`
        },
        body: JSON.stringify({
          currentPassword,
          newPassword
        })
      })
    } catch (error) {
      console.error('Password change error:', error)
      throw error
    }
  }

  // Forgot password
  async forgotPassword(email: string): Promise<void> {
    try {
      await apiFetch('/api/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email })
      })
    } catch (error) {
      console.error('Forgot password error:', error)
      throw error
    }
  }

  // Reset password
  async resetPassword(token: string, newPassword: string): Promise<void> {
    try {
      await apiFetch('/api/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({
          token,
          newPassword
        })
      })
    } catch (error) {
      console.error('Reset password error:', error)
      throw error
    }
  }
}

// Create singleton instance
const authService = new AuthService()
export default authService
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types/user';
import { apiFetch, clearApiCache } from '@/lib/api';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string, role?: string) => Promise<void>;
  signup: (email: string, password: string, name: string, role: 'student' | 'tutor' | 'admin') => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check authentication status on mount
    let cancelled = false;
    
    const checkAuth = async () => {
      try {
        // First, try to verify with backend (cookie-based auth)
        const response = await apiFetch<any>('/api/auth/me');
        const userData = response?.user || response;
        
        if (userData && !cancelled) {
          setUser(userData);
          setIsAuthenticated(true);
          localStorage.setItem('user', JSON.stringify(userData));
          return;
        }
      } catch (error) {
        console.log('Auth check failed, falling back to storage', error);
      }
      
      // Fallback to localStorage if API call fails
      if (!cancelled) {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          try {
            const parsedUser = JSON.parse(storedUser);
            setUser(parsedUser);
            setIsAuthenticated(true);
          } catch (e) {
            // Invalid stored data, clear it
            localStorage.removeItem('user');
          }
        }
      }
      
      if (!cancelled) {
        setLoading(false);
      }
    };

    checkAuth();
    
    return () => { 
      cancelled = true;
    };
  }, []);

  const login = async (email: string, password: string, role?: string) => {
    try {
      const response = await apiFetch<{ success: boolean; user: User; error?: string }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password, role }),
      });

      if (!response || !response.success || !response.user) {
        throw new Error(response?.error || 'Login failed');
      }

      const userData = response.user;
      
      // Update state immediately
      setUser(userData);
      setIsAuthenticated(true);
      
      // Store in localStorage as backup
      localStorage.setItem('user', JSON.stringify(userData));
      
      // Clear any cached API data
      clearApiCache();
      
      // Verify the cookie was set by making a test request
      try {
        await apiFetch('/api/auth/me');
      } catch (verifyError) {
        console.warn('Cookie verification failed, but login succeeded:', verifyError);
        // Don't throw - the login itself succeeded, cookie issues might be CORS-related
      }
      
    } catch (error) {
      console.error('Login error:', error);
      // Clear any partial state on error
      setUser(null);
      setIsAuthenticated(false);
      localStorage.removeItem('user');
      throw error;
    }
  };

  const signup = async (email: string, password: string, name: string, role: 'student' | 'tutor' | 'admin') => {
    try {
      const response = await apiFetch<{ success: boolean; user: User; error?: string }>('/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify({ email, password, name, role }),
      });

      if (!response || !response.success || !response.user) {
        throw new Error(response?.error || 'Signup failed');
      }

      const userData = response.user;
      setUser(userData);
      setIsAuthenticated(true);
      localStorage.setItem('user', JSON.stringify(userData));
      clearApiCache();
      
    } catch (error) {
      console.error('Signup error:', error);
      setUser(null);
      setIsAuthenticated(false);
      localStorage.removeItem('user');
      throw error;
    }
  };

  const logout = async () => {
    try { 
      await apiFetch('/api/auth/logout', { method: 'POST' }); 
    } catch (error) {
      console.error('Logout API call failed:', error);
    }
    
    // Always clear local state regardless of API success
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('user');
    localStorage.removeItem('auth_token');
    localStorage.removeItem('admin_token');
    clearApiCache();
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, isAuthenticated, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
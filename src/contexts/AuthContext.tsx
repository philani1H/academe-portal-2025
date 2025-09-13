import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types/user';
import { apiFetch } from '@/lib/api';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string, role: 'student' | 'tutor' | 'admin') => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Hydrate from backend session if available; fallback to localStorage
    let cancelled = false;
    (async () => {
      try {
        const me = await apiFetch<any>('/api/auth/me');
        const u = me?.user || me;
        if (u && !cancelled) {
          setUser(u);
          setIsAuthenticated(true);
          localStorage.setItem('user', JSON.stringify(u));
          return;
        }
      } catch {}
      if (!cancelled) {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          setUser(JSON.parse(storedUser));
          setIsAuthenticated(true);
        }
      }
    })();
    return () => { cancelled = true };
  }, []);

  const login = async (email: string, password: string) => {
    try {
      // Using mock authentication for testing
      const { mockLogin } = await import('../mocks/auth');
      const userData = await mockLogin(email, password);
      setUser(userData);
      setIsAuthenticated(true);
      localStorage.setItem('user', JSON.stringify(userData));
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const signup = async (email: string, password: string, name: string, role: 'student' | 'tutor' | 'admin') => {
    try {
      // TODO: Implement actual API call
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name, role }),
      });

      if (!response.ok) throw new Error('Signup failed');

      const userData = await response.json();
      setUser(userData);
      setIsAuthenticated(true);
      localStorage.setItem('user', JSON.stringify(userData));
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try { await apiFetch('/api/auth/logout', { method: 'POST' }); } catch {}
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, isAuthenticated }}>
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
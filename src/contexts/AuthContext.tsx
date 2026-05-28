import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types/user';
import { apiFetch, clearApiCache } from '@/lib/api';
import { socket, connectSocket, disconnectSocket } from '@/lib/socket';

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
  // Initialise from localStorage immediately — no blank screen while waiting for server
  const [user, setUser] = useState<User | null>(() => {
    try {
      const raw = localStorage.getItem('user');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      return !!localStorage.getItem('user');
    } catch {
      return false;
    }
  });
  // Only show loading if there is NO cached user — avoids blank splash on returning visitors
  const [loading, setLoading] = useState<boolean>(() => {
    try {
      return !localStorage.getItem('user');
    } catch {
      return true;
    }
  });

  useEffect(() => {
    let cancelled = false;

    // If we already have a cached user, connect socket immediately
    if (user) {
      connectSocket();
    }

    const checkAuth = async () => {
      try {
        const response = await apiFetch<any>('/api/auth/me');
        const userData = response?.user || response;

        if (userData && userData.id && !cancelled) {
          setUser(userData);
          setIsAuthenticated(true);
          localStorage.setItem('user', JSON.stringify(userData));
          connectSocket();
        }
      } catch {
        // If server check fails but we have cached data, keep showing it
        // Only clear state if there was no cached user to begin with
        if (!cancelled && !localStorage.getItem('user')) {
          setUser(null);
          setIsAuthenticated(false);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    checkAuth();

    return () => { cancelled = true; };
  }, []);

  // Listen for real-time auth changes pushed by the server
  useEffect(() => {
    const handleAuthChange = (data: { type: string; user?: User }) => {
      if (data.type === 'LOGOUT') {
        if (isAuthenticated) {
          disconnectSocket();
          setUser(null);
          setIsAuthenticated(false);
          localStorage.removeItem('user');
          localStorage.removeItem('auth_token');
          localStorage.removeItem('admin_token');
          clearApiCache();
        }
      } else if (data.type === 'LOGIN' && data.user) {
        setUser(data.user);
        setIsAuthenticated(true);
        localStorage.setItem('user', JSON.stringify(data.user));
      }
    };

    socket.on('auth-state-change', handleAuthChange);
    return () => { socket.off('auth-state-change', handleAuthChange); };
  }, [isAuthenticated]);

  const login = async (email: string, password: string, role?: string) => {
    try {
      const response = await apiFetch<{ success: boolean; user: User; token?: string; error?: string }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password, role }),
      });

      if (!response || !response.success || !response.user) {
        throw new Error(response?.error || 'Login failed');
      }

      const userData = response.user;
      setUser(userData);
      setIsAuthenticated(true);
      localStorage.setItem('user', JSON.stringify(userData));

      // Store JWT for cross-origin API & socket auth (cookie alone fails cross-origin in production)
      if (response.token) {
        localStorage.setItem('auth_token', response.token);
      }

      connectSocket();
      clearApiCache();

    } catch (error: any) {
      setUser(null);
      setIsAuthenticated(false);
      localStorage.removeItem('user');
      const msg = String(error?.message || '');
      const jsonMatch = msg.match(/\{.*\}/s);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0]);
          if (parsed.error || parsed.message) {
            throw new Error(parsed.error || parsed.message);
          }
        } catch (parseErr: any) {
          if (parseErr.message !== msg) throw parseErr;
        }
      }
      throw error;
    }
  };

  const signup = async (email: string, password: string, name: string, role: 'student' | 'tutor' | 'admin') => {
    try {
      const response = await apiFetch<{ success: boolean; user: User; token?: string; error?: string }>('/api/auth/signup', {
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
      if (response.token) {
        localStorage.setItem('auth_token', response.token);
      }
      connectSocket();
      clearApiCache();

    } catch (error) {
      setUser(null);
      setIsAuthenticated(false);
      localStorage.removeItem('user');
      throw error;
    }
  };

  const logout = async () => {
    try {
      await apiFetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // Always clear local state even if API fails
    }

    disconnectSocket();
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

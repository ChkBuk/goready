'use client';

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { api, setTokens, clearTokens } from './api';

interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  currency: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const res = await api.get<User>('/api/auth/me');
      if (res.success && res.data) {
        setUser(res.data);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    if (token) {
      refreshUser().finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, [refreshUser]);

  const login = async (email: string, password: string) => {
    const res = await api.post<{ user: User; accessToken: string; refreshToken: string }>(
      '/api/auth/login',
      { email, password }
    );

    if (res.success && res.data) {
      setTokens(res.data.accessToken, res.data.refreshToken);
      setUser(res.data.user);
      return { success: true };
    }

    return { success: false, error: res.error || 'Login failed' };
  };

  const register = async (name: string, email: string, password: string) => {
    const res = await api.post<{ user: User; accessToken: string; refreshToken: string }>(
      '/api/auth/register',
      { name, email, password }
    );

    if (res.success && res.data) {
      setTokens(res.data.accessToken, res.data.refreshToken);
      setUser(res.data.user);
      return { success: true };
    }

    return { success: false, error: res.error || 'Registration failed' };
  };

  const logout = () => {
    clearTokens();
    setUser(null);
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

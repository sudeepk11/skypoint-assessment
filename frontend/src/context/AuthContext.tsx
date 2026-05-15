import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { User } from '../types';
import { auth } from '../services/api';

interface AuthContextType {
  user: User | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  updateUser: (user: User) => void;
  isAuthenticated: boolean;
  isHR: boolean;
  isCandidate: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // token param kept for API compatibility but the real auth is the HttpOnly cookie
  const login = useCallback((_token: string, newUser: User) => {
    localStorage.setItem('user', JSON.stringify(newUser));
    setUser(newUser);
  }, []);

  const logout = useCallback(async () => {
    // Tell the backend to clear the HttpOnly cookie
    await auth.logout();
    localStorage.removeItem('user');
    setUser(null);
  }, []);

  const updateUser = useCallback((updatedUser: User) => {
    localStorage.setItem('user', JSON.stringify(updatedUser));
    setUser(updatedUser);
  }, []);

  useEffect(() => {
    const restoreSession = async () => {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          // Validate the HttpOnly cookie is still valid via /me
          const me = await auth.me();
          setUser(me);
          localStorage.setItem('user', JSON.stringify(me));
        } catch {
          // Cookie expired or invalid — clear local state
          localStorage.removeItem('user');
          setUser(null);
        }
      }
      setLoading(false);
    };

    restoreSession();
  }, []);

  const value: AuthContextType = {
    user,
    login,
    logout,
    updateUser,
    isAuthenticated: !!user,
    isHR: user?.role === 'hr',
    isCandidate: user?.role === 'candidate',
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
};

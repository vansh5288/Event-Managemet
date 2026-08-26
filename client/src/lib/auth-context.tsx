import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api, authApi } from './api';
import type { User } from './types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  verifyOtp: (email: string, otp: string) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (email: string, otp: string, password: string) => Promise<void>;
  oauthConfig: () => Promise<{ googleEnabled: boolean; githubEnabled: boolean }>;
  oauthLogin: (provider: 'google' | 'github', code: string) => Promise<void>;
  refreshUser: () => Promise<void>;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isOrganizer: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      setLoading(false);
      return;
    }
    api.setToken(token);
    try {
      const res = await api.get<{ success: boolean; data: User }>('/auth/me');
      setUser(res.data);
    } catch {
      api.setToken(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const res = await api.get<{ success: boolean; data: User }>('/auth/me');
      setUser(res.data);
    } catch {
      // Ignore - handled on next fetch
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const login = async (email: string, password: string) => {
    const res = await api.post<{ success: boolean; data: { user: User; accessToken: string; refreshToken: string } }>('/auth/login', { email, password });
    api.setToken(res.data.accessToken);
    localStorage.setItem('refreshToken', res.data.refreshToken);
    setUser(res.data.user);
  };

  const signup = async (name: string, email: string, password: string) => {
    const res = await api.post<{ success: boolean; data: { user: User; accessToken: string; refreshToken: string } }>('/auth/signup', { name, email, password });
    api.setToken(res.data.accessToken);
    localStorage.setItem('refreshToken', res.data.refreshToken);
    setUser(res.data.user);
  };

  const verifyOtp = async (email: string, otp: string) => {
    await authApi.verifyOtp({ email, otp });
  };

  const forgotPassword = async (email: string) => {
    await authApi.forgotPassword({ email });
  };

  const resetPassword = async (email: string, otp: string, password: string) => {
    await authApi.resetPassword({ email, otp, password });
  };

  const oauthConfig = async () => {
    const res = await authApi.oauthConfig();
    return res.data;
  };

  const oauthLogin = async (provider: 'google' | 'github', code: string) => {
    if (provider === 'google') {
      const res = await authApi.googleLogin(code);
      api.setToken(res.data.accessToken);
      localStorage.setItem('refreshToken', res.data.refreshToken);
      setUser(res.data.user);
    } else {
      const res = await authApi.githubLogin(code);
      api.setToken(res.data.accessToken);
      localStorage.setItem('refreshToken', res.data.refreshToken);
      setUser(res.data.user);
    }
  };

  const logout = () => {
    api.setToken(null);
    localStorage.removeItem('refreshToken');
    setUser(null);
  };

  const isAuthenticated = !!user;
  const isAdmin = user?.role === 'admin';
  const isOrganizer = user?.role === 'organizer' || user?.role === 'admin';

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        signup,
        logout,
        verifyOtp,
        forgotPassword,
        resetPassword,
        oauthConfig,
        oauthLogin,
        refreshUser,
        isAuthenticated,
        isAdmin,
        isOrganizer,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}


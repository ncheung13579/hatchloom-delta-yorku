import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { User } from '../types';

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (token: string) => void;
  logout: () => void;
  isAdmin: boolean;
  isTeacher: boolean;
}

const TOKEN_USER_MAP: Record<string, User> = {
  'test-admin-token': {
    id: 1,
    name: 'Ms. Patel',
    email: 'patel@ridgewood.edu',
    role: 'school_admin',
    school_id: 1,
    school_name: 'Ridgewood Academy',
  },
  'test-teacher-token': {
    id: 2,
    name: 'Mr. Chen',
    email: 'chen@ridgewood.edu',
    role: 'school_teacher',
    school_id: 1,
    school_name: 'Ridgewood Academy',
  },
};

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('hatchloom_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    const savedUser = localStorage.getItem('hatchloom_user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch {
        // Fall through to token map
      }
    }
    if (!user) {
      const mapped = TOKEN_USER_MAP[token];
      if (mapped) {
        setUser(mapped);
        localStorage.setItem('hatchloom_user', JSON.stringify(mapped));
      }
    }
    setLoading(false);
  }, [token]);

  const login = useCallback((newToken: string) => {
    const mapped = TOKEN_USER_MAP[newToken];
    if (mapped) {
      localStorage.setItem('hatchloom_token', newToken);
      localStorage.setItem('hatchloom_user', JSON.stringify(mapped));
      setToken(newToken);
      setUser(mapped);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('hatchloom_token');
    localStorage.removeItem('hatchloom_user');
    setToken(null);
    setUser(null);
  }, []);

  const value: AuthState = {
    user,
    token,
    loading,
    login,
    logout,
    isAdmin: user?.role === 'school_admin',
    isTeacher: user?.role === 'school_teacher',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

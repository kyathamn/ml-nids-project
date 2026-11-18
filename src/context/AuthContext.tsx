import React, { createContext, useContext, useState, useEffect } from 'react';
import { AppModule, AuthUser } from '../types';

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => void;
  hasModuleAccess: (module: AppModule) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const FALLBACK_USERS: Array<AuthUser & { password: string }> = [
  {
    id: 'usr-01',
    username: 'admin',
    password: '123',
    fullName: 'Chief Security Admin',
    role: 'admin',
    roleLabel: 'Security Administrator',
    allowedModules: ['monitor', 'benchmark', 'features', 'tester', 'report'],
    canRetrain: true,
  },
  {
    id: 'usr-02',
    username: 'analyst',
    password: '123',
    fullName: 'SOC Threat Analyst',
    role: 'analyst',
    roleLabel: 'SOC Tier-2 Analyst',
    allowedModules: ['monitor', 'tester', 'report'],
    canRetrain: false,
  },
  {
    id: 'usr-03',
    username: 'researcher',
    password: '123',
    fullName: 'ML Security Researcher',
    role: 'researcher',
    roleLabel: 'ML Research Engineer',
    allowedModules: ['benchmark', 'features', 'tester', 'report'],
    canRetrain: true,
  },
  {
    id: 'usr-04',
    username: 'viewer',
    password: '123',
    fullName: 'Audit Guest Viewer',
    role: 'viewer',
    roleLabel: 'Read-Only Auditor',
    allowedModules: ['monitor', 'report'],
    canRetrain: false,
  },
];

FALLBACK_USERS[0].password = 'admin123';
FALLBACK_USERS[1].password = 'analyst123';
FALLBACK_USERS[2].password = 'research123';
FALLBACK_USERS[3].password = 'viewer123';

const STORAGE_KEY = 'ml_nids_auth_session';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed?.user && parsed?.token) {
          setUser(parsed.user);
          setToken(parsed.token);
        }
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (username: string, password: string): Promise<{ ok: boolean; error?: string }> => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const data = await res.json();
        if (!res.ok) {
          return { ok: false, error: data.error || 'Authentication failed' };
        }
        setUser(data.user);
        setToken(data.token);
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ user: data.user, token: data.token }));
        return { ok: true };
      }
    } catch {
      // Fallback for pure Vite mode without Express backend
    }

    const matched = FALLBACK_USERS.find(
      (u) => u.username.toLowerCase() === username.trim().toLowerCase() && u.password === password
    );

    if (!matched) {
      return { ok: false, error: 'Invalid credentials. Check username and password.' };
    }

    const { password: _, ...safeUser } = matched;
    const localToken = `local-${Date.now()}`;
    setUser(safeUser);
    setToken(localToken);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ user: safeUser, token: localToken }));
    return { ok: true };
  };

  const logout = () => {
    if (token) {
      fetch('/api/auth/logout', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {});
    }
    setUser(null);
    setToken(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  const hasModuleAccess = (module: AppModule): boolean => {
    if (!user) return false;
    return user.allowedModules.includes(module);
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout, hasModuleAccess }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};

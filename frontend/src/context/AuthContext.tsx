
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import api from '../api/axios';

export type Role = 'admin' | 'manager' | 'employee';

export type User = {
  id: number;
  name: string;
  email: string;
  role: Role;
};

type AuthContextType = {
  user: User | null;
  loading: boolean;
  refreshUser: () => Promise<User | null>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  async function refreshUser(): Promise<User | null> {
    try {
      const response = await api.get<{ user: User }>('/api/me');
      setUser(response.data.user);
      return response.data.user;
    } catch {
      setUser(null);
      return null;
    }
  }

  useEffect(() => {
    refreshUser().finally(() => setLoading(false));
  }, []);

  async function logout() {
    await api.post('/api/logout');
    setUser(null);
  }

  return (
    <AuthContext.Provider
      value={{ user, loading, refreshUser, logout }}
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

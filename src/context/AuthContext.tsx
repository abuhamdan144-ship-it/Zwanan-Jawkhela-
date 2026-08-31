import React, { createContext, useContext, useState, ReactNode } from 'react';
import { User, mockUsers } from '../data/mockData';

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null); // Start unauthenticated
  const [isLoading, setIsLoading] = useState(false);

  const login = (username: string, password: string) => {
    setIsLoading(true);
    // Simulate network request
    setTimeout(() => {
      if (username === 'AdminZJ' && password === 'Pakistan1947') {
        setUser({ ...mockUsers[0], name: 'AdminZJ', role: 'superadmin' });
      } else {
        alert('Invalid username or password.');
      }
      setIsLoading(false);
    }, 500);
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
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

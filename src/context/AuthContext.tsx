import React, { createContext, useContext, useState, ReactNode } from 'react';
import { User, mockUsers } from '../data/mockData';

interface AuthContextType {
  user: User | null;
  login: (identifier: string, password?: string) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null); // Start unauthenticated
  const [isLoading, setIsLoading] = useState(false);

  const login = (identifier: string, password?: string) => {
    setIsLoading(true);
    // Simulate network request
    setTimeout(() => {
      const isAdminLogin = identifier === 'AdminZJ' && password === 'Pakistan1947';
      const foundUser = mockUsers.find(u => u.cnic === identifier);
      if (isAdminLogin) {
        setUser({ ...mockUsers[0], name: 'AdminZJ', role: 'superadmin' });
      } else if (foundUser && foundUser.status === 'approved') {
        setUser(foundUser);
      } else {
        alert('Invalid credentials or member not approved.');
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

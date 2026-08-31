import React, { createContext, useContext, useState, ReactNode } from 'react';
import { User, mockUsers } from '../data/mockData';
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { firebaseApp } from '../firebase';

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null); // Start unauthenticated
  const [isLoading, setIsLoading] = useState(true);

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(getAuth(firebaseApp), (firebaseUser) => {
      setUser(firebaseUser ? { ...mockUsers[0], name: 'AdminZJ', role: 'superadmin' } : null);
      setIsLoading(false);
    });
    return unsubscribe;
  }, []);

  const login = async (username: string, password: string) => {
    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(getAuth(firebaseApp), username === 'AdminZJ' ? 'adminzj@zwananjawkhela.com' : username, password);
    } catch {
      alert('Invalid username or password.');
      setIsLoading(false);
    }
  };

  const logout = () => {
    void signOut(getAuth(firebaseApp));
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

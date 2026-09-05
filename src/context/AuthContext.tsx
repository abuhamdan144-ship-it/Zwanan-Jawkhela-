import React, { createContext, useContext, useState, ReactNode } from 'react';
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { firebaseApp, db } from '../firebase';

export interface User {
  id: string;
  name: string;
  fatherName: string;
  cnic: string;
  phone: string;
  address: string;
  bloodGroup: string;
  status: 'pending' | 'approved' | 'rejected';
  role: 'member' | 'admin' | 'superadmin';
  validUntil?: string;
}

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
    // Check for hardcoded local mock admin
    if (localStorage.getItem('mockAdmin') === 'true') {
      setUser({ id: 'mock-admin-id', name: 'Admin', fatherName: '', cnic: 'admin', phone: '', address: '', bloodGroup: 'O+', status: 'approved', role: 'superadmin' });
      setIsLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(getAuth(firebaseApp), async (firebaseUser) => {
      if (firebaseUser) {
        if (firebaseUser.email === 'adminzj@zwananjawkhela.com') {
          setUser({ id: firebaseUser.uid, name: 'AdminZJ', fatherName: '', cnic: 'AdminZJ', phone: '', address: '', bloodGroup: 'O+', status: 'approved', role: 'superadmin' });
        } else {
          try {
            const userDoc = await getDoc(doc(db, 'members', firebaseUser.uid));
            if (userDoc.exists()) {
              setUser({ id: userDoc.id, ...userDoc.data() } as User);
            } else {
              setUser({ id: firebaseUser.uid, name: 'Pending User', fatherName: '', cnic: firebaseUser.email?.split('@')[0] || '', phone: '', address: '', bloodGroup: 'O+', status: 'pending', role: 'member' });
            }
          } catch (error: any) {
            console.error("Error fetching user data:", error);
            if (error.code === 'permission-denied') {
              alert("Firebase Permissions Error: Please update your Firestore Security Rules to allow access.");
            }
            // Allow them to exist as a default user so they aren't completely blocked
            setUser({ id: firebaseUser.uid, name: 'Restricted User', fatherName: '', cnic: firebaseUser.email?.split('@')[0] || '', phone: '', address: '', bloodGroup: 'O+', status: 'pending', role: 'member' });
          }
        }
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });
    return unsubscribe;
  }, []);

  const login = async (username: string, password: string) => {
    setIsLoading(true);

    // Hardcoded bypass for testing
    if (username.toLowerCase() === 'admin' && password === '1234') {
      localStorage.setItem('mockAdmin', 'true');
      setUser({ id: 'mock-admin-id', name: 'Admin', fatherName: '', cnic: 'admin', phone: '', address: '', bloodGroup: 'O+', status: 'approved', role: 'superadmin' });
      setIsLoading(false);
      return;
    }

    try {
      const cleanUsername = username === 'AdminZJ' ? 'adminzj' : username.replace(/[^a-zA-Z0-9]/g, '');
      const email = `${cleanUsername}@zwananjawkhela.com`;
      await signInWithEmailAndPassword(getAuth(firebaseApp), email, password);
    } catch (error: any) {
      alert('Invalid username or password: ' + error.message);
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('mockAdmin');
    setUser(null);
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

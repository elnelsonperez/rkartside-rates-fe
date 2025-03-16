import { createContext, useContext, ReactNode } from 'react';
import { User } from '../types';
import { Store } from '../lib/api';
import { useAuthStore } from '../lib/auth-store';

interface AuthContextType {
  user: (User & { isAdmin?: boolean }) | null;
  loading: boolean;
  currentStore: Store | null;
  setCurrentStore: (store: Store) => void;
  updateUserIsAdmin: (isAdmin: boolean) => void;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  // Use the auth store directly
  const { user, isAdmin, isLoading, currentStore, setCurrentStore, setIsAdmin, login, logout } =
    useAuthStore();

  // Map the auth store values to the existing context interface
  const value: AuthContextType = {
    user: user
      ? {
          ...user,
          isAdmin,
        }
      : null,
    loading: isLoading,
    currentStore,
    setCurrentStore,
    updateUserIsAdmin: setIsAdmin,
    signIn: login,
    signOut: logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

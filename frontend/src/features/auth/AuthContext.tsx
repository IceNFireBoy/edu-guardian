import React, { createContext, ReactNode, useContext } from 'react';
import { useAuth } from './useAuth';
import { User } from './authTypes';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<User>;
  registerUser: (userData: { email: string; password: string; name: string; username?: string }) => Promise<User>;
  logout: () => Promise<void>;
  fetchCurrentUser: () => Promise<User>;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

// Create the context with a default value
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider component - all auth state and actions live in useAuth
export const AuthProvider: React.FC<{children: ReactNode}> = ({ children }) => {
  const auth = useAuth();

  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the auth context
export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;

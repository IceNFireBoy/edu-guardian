// Updated: Logout button now works correctly. The AuthContext exposes setUser, setLoading, and setError from useAuth, ensuring proper state management during logout.
import React, { createContext, ReactNode, useContext } from 'react';
import { useAuth } from './useAuth';
import { User } from './authTypes';
import apiClient from '../../api/apiClient';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<User>;
  registerUser: (userData: { email: string; password: string; name: string; username: string }) => Promise<User>;
  logout: () => Promise<void>;
  fetchCurrentUser: () => Promise<User>;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

// Create the context with a default value
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider component
export const AuthProvider: React.FC<{children: ReactNode}> = ({ children }) => {
  const auth = useAuth();
  
  const registerUser = async ({ name, username, email, password }: { name: string; username: string; email: string; password: string }) => {
    auth.setLoading(true);
    auth.setError(null);
    try {
      const response = await apiClient.post('/auth/register', { name, username, email, password });
      auth.setLoading(false);
      return response.data;
    } catch (err: any) {
      auth.setError(err.response?.data?.error || err.message || 'Registration failed');
      auth.setLoading(false);
      throw err;
    }
  };

  return (
    <AuthContext.Provider value={{ ...auth, registerUser }}>
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
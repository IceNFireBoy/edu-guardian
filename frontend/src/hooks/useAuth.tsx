import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { api } from 'utils/api';

// Define types
interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  xp: number;
  level: number;
  profileImage?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: RegisterFormData) => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

interface RegisterFormData {
  name: string;
  email: string;
  password: string;
  username: string;
}

// Create context
const AuthContext = createContext<AuthContextType | null>(null);

// Provider component
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check for stored token and user data on mount
  useEffect(() => {
    const checkLoggedIn = async () => {
      setIsLoading(true);
      try {
        const token = localStorage.getItem('token');
        
        if (token) {
          // No need to set axios.defaults.headers.common['Authorization'] here,
          // the 'api' instance's request interceptor handles it.
          
          const storedUser = localStorage.getItem('user');
          if (storedUser) {
            setUser(JSON.parse(storedUser));
          } else {
            const res = await api.get('/v1/auth/me'); // Use api instance, ensure path is relative to baseURL
            setUser(res.data.data);
            localStorage.setItem('user', JSON.stringify(res.data.data));
          }
        }
      } catch (err) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        // No need to delete axios.defaults.headers.common['Authorization'] if not set globally
        console.error('Auth check failed:', err);
      } finally {
        setIsLoading(false);
      }
    };

    checkLoggedIn();
  }, []);

  // Login user
  const login = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Path should be relative to the baseURL in api.ts (e.g., /v1/auth/login if baseURL is /api)
      const res = await api.post('/v1/auth/login', { email, password }); 
      
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.data));
      
      // No need to set axios.defaults.headers.common['Authorization']
      setUser(res.data.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Register user
  const register = async (userData: RegisterFormData) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Path should be relative to the baseURL in api.ts
      const res = await api.post('/v1/auth/register', userData);
      
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.data));
      
      // No need to set axios.defaults.headers.common['Authorization']
      setUser(res.data.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Logout user
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    // No need to delete axios.defaults.headers.common['Authorization']
    setUser(null);
  };

  // Clear any errors
  const clearError = () => {
    setError(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        error,
        login,
        register,
        logout,
        clearError
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default useAuth; 
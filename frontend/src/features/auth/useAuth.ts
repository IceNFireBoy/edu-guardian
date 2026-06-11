import { useState, useEffect, useCallback } from 'react';
import { User } from './authTypes';
import { callAuthenticatedApi } from '../../api/apiClient'; // Import the API calling utility
import { useNavigate } from 'react-router-dom';

// Helper to manage token in localStorage
const getToken = (): string | null => localStorage.getItem('token');
const setToken = (token: string): void => localStorage.setItem('token', token);
const removeToken = (): void => localStorage.removeItem('token');

interface ApiResponse<T> {
  success: boolean;
  data: T;
  token?: string;
  message?: string;
}

// Shape of /auth/login and /auth/register responses: the user object is
// returned under the `user` key (NOT `data`)
interface AuthTokenResponse {
  success: boolean;
  token: string;
  user: User;
}

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true); // Start as loading to check for existing token
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Check for existing token on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = getToken();
      if (token) {
        try {
          await fetchCurrentUser();
        } catch (err) {
          // Token invalid or expired
          removeToken();
          setUser(null);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };
    
    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await callAuthenticatedApi<AuthTokenResponse>('/auth/login', 'POST', { email, password });

      if (!response?.token || !response?.user) {
        throw new Error('Unexpected response from the server. Please try again.');
      }

      setToken(response.token);
      setUser(response.user);
      return response.user;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const registerUser = async (userData: { email: string; password: string; name: string; username?: string }) => {
    try {
      setLoading(true);
      setError(null);
      const response = await callAuthenticatedApi<AuthTokenResponse>('/auth/register', 'POST', userData);

      if (!response?.token || !response?.user) {
        throw new Error('Unexpected response from the server. Please try again.');
      }

      setToken(response.token);
      setUser(response.user);
      return response.user;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = useCallback(async () => {
    setLoading(true);
    try {
      await callAuthenticatedApi('/auth/logout', 'POST', {});
    } catch {
      // Logging out locally must always succeed, even if the API is down
    } finally {
      removeToken();
      setUser(null);
      setLoading(false);
      navigate('/login');
    }
  }, [navigate]);

  const fetchCurrentUser = useCallback(async () => {
    try {
      setLoading(true);
      const response = await callAuthenticatedApi<ApiResponse<User>>('/auth/me');
      setUser(response.data);
      return response.data;
    } catch (err: any) {
      setUser(null);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    user,
    loading,
    error,
    login,
    registerUser,
    logout,
    fetchCurrentUser,
    isAuthenticated: !!user,
    setUser,
    setLoading,
    setError
  };
}; 
import { useState, useCallback } from 'react';
import { User } from '../../types/user';
import { api } from '../../utils/api';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = useCallback(async (email: string, password: string): Promise<User> => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.post('/auth/login', { email, password });
      const userData = response.data;
      setUser(userData);
      return userData;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to login');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const registerUser = useCallback(async (userData: { email: string; password: string; name: string }): Promise<User> => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.post('/auth/register', userData);
      const newUser = response.data;
      setUser(newUser);
      return newUser;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to register');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      await api.post('/auth/logout');
      setUser(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to logout');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCurrentUser = useCallback(async (): Promise<User> => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/auth/me');
      const userData = response.data;
      setUser(userData);
      return userData;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch user');
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
    isAuthenticated: !!user
  };
}; 
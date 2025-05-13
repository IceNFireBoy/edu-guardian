import { useState, useEffect, useCallback } from 'react';
import { User, LoginCredentials, RegisterCredentials } from './authTypes';
// Assuming UserProfile is defined in userTypes.ts and is compatible with what the backend returns
// If not, User type here might need adjustment or UserProfile should be imported.
// For now, we'll assume 'User' from authTypes is sufficient or can be adapted.
import { callAuthenticatedApi } from '../../api/apiClient'; // Import the API calling utility
import { UserProfile } from '../user/userTypes'; // Assuming UserProfile is the detailed type
import { useNavigate } from 'react-router-dom';

// Helper to manage token in localStorage
const getToken = (): string | null => localStorage.getItem('token');
const setToken = (token: string): void => localStorage.setItem('token', token);
const removeToken = (): void => localStorage.removeItem('token');

interface ApiResponse<T> {
  data: T;
  message?: string;
}

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await callAuthenticatedApi<ApiResponse<User>>('/auth/login', 'POST', { email, password });
      setUser(response.data);
      return response.data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const registerUser = async (userData: { email: string; password: string; name: string }) => {
    try {
      setLoading(true);
      setError(null);
      const response = await callAuthenticatedApi<ApiResponse<User>>('/auth/register', 'POST', userData);
      setUser(response.data);
      return response.data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = useCallback(async () => {
    try {
      setLoading(true);
      await callAuthenticatedApi('/auth/logout', 'POST');
      setUser(null);
      navigate('/login');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
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
    fetchCurrentUser
  };
}; 
import { User } from 'types/user';
import { AuthResponse } from 'types/api';
import axios from 'axios';
import { useState } from 'react';

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
}

export const useAuth = () => {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    loading: false,
    error: null
  });

  const login = async (email: string, password: string) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      const res = await axios.post<AuthResponse>('/api/auth/login', { email, password });
      const response = res.data;
      
      setState(prev => ({
        ...prev,
        user: response.data,
        token: response.token,
        loading: false
      }));

      localStorage.setItem('user', JSON.stringify(response.data));
      localStorage.setItem('token', response.token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${response.token}`;
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'An error occurred'
      }));
    }
  };

  const register = async (userData: Partial<User>) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      const res = await axios.post<AuthResponse>('/api/auth/register', userData);
      const response = res.data;

      setState(prev => ({
        ...prev,
        user: response.data,
        token: response.token,
        loading: false
      }));

      localStorage.setItem('user', JSON.stringify(response.data));
      localStorage.setItem('token', response.token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${response.token}`;
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'An error occurred'
      }));
    }
  };

  const logout = () => {
    setState({
      user: null,
      token: null,
      loading: false,
      error: null
    });
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
  };

  return {
    user: state.user,
    token: state.token,
    loading: state.loading,
    error: state.error,
    login,
    register,
    logout
  };
}; 
import { useState, useEffect, useCallback } from 'react';
import { User, LoginCredentials, RegisterCredentials } from './authTypes';
// Assuming UserProfile is defined in userTypes.ts and is compatible with what the backend returns
// If not, User type here might need adjustment or UserProfile should be imported.
// For now, we'll assume 'User' from authTypes is sufficient or can be adapted.
import { callAuthenticatedApi } from '../../api/apiClient'; // Import the API calling utility
import { UserProfile } from '../user/userTypes'; // Assuming UserProfile is the detailed type

// Helper to manage token in localStorage
const getToken = (): string | null => localStorage.getItem('token');
const setToken = (token: string): void => localStorage.setItem('token', token);
const removeToken = (): void => localStorage.removeItem('token');

export const useAuth = () => {
  const [user, setUser] = useState<UserProfile | null>(null); // Use UserProfile for more detail
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null); // Added error state

  const fetchCurrentUser = useCallback(async () => {
    setLoading(true);
    setError(null);
    const token = getToken();
    if (token) {
      try {
        // apiClient's interceptor should automatically add the token if it's stored as a Bearer token.
        // If HttpOnly cookies are used, this call will work if the cookie is present.
        // Assuming the response structure is { success: boolean, data: UserProfile }
        const response = await callAuthenticatedApi<{ success: boolean, data: UserProfile }>('/auth/profile', 'GET');
        if (response.success && response.data) {
          setUser(response.data);
          setIsAuthenticated(true);
        } else {
          removeToken(); // Token might be invalid
          setIsAuthenticated(false);
          setUser(null);
          setError(response.message || 'Failed to fetch user profile.');
        }
      } catch (err: any) {
        removeToken();
        setIsAuthenticated(false);
        setUser(null);
        setError(err.message || 'Session expired or invalid. Please log in again.');
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  const login = async (credentials: LoginCredentials): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      // Assuming backend returns { success: true, token: '...', data: UserProfile }
      // or sets an HttpOnly cookie and returns { success: true, data: UserProfile }
      const response = await callAuthenticatedApi<{ success: boolean, token?: string, data: UserProfile }>('/auth/login', 'POST', credentials);
      if (response.success && response.data) {
        if (response.token) { // If token is explicitly returned
          setToken(response.token);
        }
        setUser(response.data);
        setIsAuthenticated(true);
        setLoading(false);
        return true;
      } else {
        throw new Error(response.message || 'Login failed. Please check your credentials.');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed.');
      setIsAuthenticated(false);
      setUser(null);
      setLoading(false);
      return false;
    }
  };

  const registerUser = async (credentials: RegisterCredentials): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      // Assuming backend returns { success: true, token: '...', data: UserProfile }
      // or sets an HttpOnly cookie and returns { success: true, data: UserProfile }
      const response = await callAuthenticatedApi<{ success: boolean, token?: string, data: UserProfile }>('/auth/register', 'POST', credentials);
      if (response.success && response.data) {
        if (response.token) { // If token is explicitly returned
          setToken(response.token);
        }
        setUser(response.data);
        setIsAuthenticated(true);
        setLoading(false);
        return true;
      } else {
        throw new Error(response.message || 'Registration failed. Please try again.');
      }
    } catch (err: any) {
      setError(err.message || 'Registration failed.');
      setIsAuthenticated(false);
      setUser(null);
      setLoading(false);
      return false;
    }
  };

  const logout = useCallback(async () => {
    setLoading(true);
    setError(null);
    // Optionally call a backend logout endpoint
    try {
      await callAuthenticatedApi('/auth/logout', 'POST'); // Assuming a POST to /auth/logout
    } catch (err: any) {
      // Even if backend logout fails, clear client-side session
      console.error("Logout API call failed, proceeding with client-side logout:", err.message);
    } finally {
      removeToken();
      setUser(null);
      setIsAuthenticated(false);
      setLoading(false);
      // Add any additional cleanup like clearing caches if necessary
    }
  }, []);

  return {
    user,
    isAuthenticated,
    loading,
    error, // Expose error state
    login,
    logout,
    registerUser,
    fetchCurrentUser // Expose this if manual refresh is needed
  };
}; 
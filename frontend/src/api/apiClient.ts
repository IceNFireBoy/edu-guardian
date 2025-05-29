import axios from 'axios';
import { handleApiError, retryWithBackoff, ErrorType } from '../utils/errorHandler';
import toast from 'react-hot-toast';

// Base API URL from environment variables with fallback to local development
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

console.log('API URL:', API_URL); // Debug: Log API URL to verify configuration

// Create axios instance with defaults
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true, // Include cookies in requests
  timeout: 10000 // Add reasonable timeout
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    // Get token from localStorage if it exists
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Log requests in development mode
    if (process.env.NODE_ENV !== 'production') {
      console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`, config);
    }
    
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => {
    // Log responses in development mode
    if (process.env.NODE_ENV !== 'production') {
      console.log(`✅ API Response: ${response.config.method?.toUpperCase()} ${response.config.url}`, response.data);
    }
    return response;
  },
  (error) => {
    // Log detailed error information
    console.error(`❌ API Error: ${error.config?.method?.toUpperCase()} ${error.config?.url}`, error);
    
    // Session expiration handling
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      if (window.location.pathname !== '/login') {
        toast.error('Your session has expired. Please log in again.');
        setTimeout(() => {
          window.location.href = '/login';
        }, 1500);
      }
    }
    
    return Promise.reject(error);
  }
);

// Function to call authenticated endpoints
export const callAuthenticatedApi = async <T>(
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
  data: any = null,
  headers: any = {},
  retries = 2
): Promise<T> => {
  try {
    // Disable retries for logout requests to prevent rate limiting
    const shouldRetry = endpoint !== '/auth/logout';
    return await retryWithBackoff(async () => {
      let response;
      
      switch (method) {
        case 'GET':
          response = await apiClient.get(endpoint, { headers });
          break;
        case 'POST':
          response = await apiClient.post(endpoint, data, { headers });
          break;
        case 'PUT':
          response = await apiClient.put(endpoint, data, { headers });
          break;
        case 'DELETE':
          response = await apiClient.delete(endpoint, { headers });
          break;
        default:
          throw new Error(`Unsupported method: ${method}`);
      }

      return response.data;
    }, shouldRetry ? retries : 0);
  } catch (error: any) {
    // Use the central error handler
    const { message } = handleApiError(error);
    throw new Error(message);
  }
};

// Health check function
export const checkApiHealth = async (): Promise<boolean> => {
  try {
    await apiClient.get('/test'); // Updated endpoint to match backend
    console.log('API health check: Connected successfully');
    return true;
  } catch (error) {
    console.error('API health check: Failed to connect to API', error);
    toast.error('Unable to connect to the server. Please check your internet connection.');
    return false;
  }
};

export default apiClient; 
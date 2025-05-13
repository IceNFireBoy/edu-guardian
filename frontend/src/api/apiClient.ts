import axios from 'axios';

// Base API URL
const API_URL = '/api/v1';

// Create axios instance with defaults
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true // Include cookies in requests
});

// Function to call authenticated endpoints
export const callAuthenticatedApi = async <T>(
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
  data: any = null,
  headers: any = {}
): Promise<T> => {
  try {
    const config = {
      headers: {
        ...headers
      }
    };

    let response;
    
    switch (method) {
      case 'GET':
        response = await apiClient.get(endpoint, config);
        break;
      case 'POST':
        response = await apiClient.post(endpoint, data, config);
        break;
      case 'PUT':
        response = await apiClient.put(endpoint, data, config);
        break;
      case 'DELETE':
        response = await apiClient.delete(endpoint, config);
        break;
      default:
        throw new Error(`Unsupported method: ${method}`);
    }

    return response.data;
  } catch (error: any) {
    // Handle different error types
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      const errorMessage = error.response.data?.message || error.response.data?.error || 'An error occurred';
      throw new Error(errorMessage);
    } else if (error.request) {
      // The request was made but no response was received
      throw new Error('No response from server. Please check your connection.');
    } else {
      // Something happened in setting up the request that triggered an Error
      throw error;
    }
  }
};

export default apiClient; 
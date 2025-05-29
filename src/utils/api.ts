import axios, { AxiosRequestConfig } from 'axios';
import { ApiResponse, ApiError } from 'types/api';

type ApiConfig = AxiosRequestConfig;

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api/v1',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    const apiError: ApiError = {
      message: error.response?.data?.message || 'An error occurred',
      status: error.response?.status || 500,
      data: error.response?.data
    };
    return Promise.reject(apiError);
  }
);

export const get = async <T>(url: string, config?: ApiConfig): Promise<ApiResponse<T>> => {
  try {
    const response = await api.get<ApiResponse<T>>(url, config);
    return response;
  } catch (error) {
    throw error as ApiError;
  }
};

export const post = async <T>(url: string, data?: any, config?: ApiConfig): Promise<ApiResponse<T>> => {
  try {
    const response = await api.post<ApiResponse<T>>(url, data, config);
    return response;
  } catch (error) {
    throw error as ApiError;
  }
};

export const put = async <T>(url: string, data?: any, config?: ApiConfig): Promise<ApiResponse<T>> => {
  try {
    const response = await api.put<ApiResponse<T>>(url, data, config);
    return response;
  } catch (error) {
    throw error as ApiError;
  }
};

export const del = async <T>(url: string, config?: ApiConfig): Promise<ApiResponse<T>> => {
  try {
    const response = await api.delete<ApiResponse<T>>(url, config);
    return response;
  } catch (error) {
    throw error as ApiError;
  }
};

export { api }; 
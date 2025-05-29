import type { AxiosError, AxiosRequestConfig } from 'axios';
import type { Note, NoteFilter, PaginatedNotesResponse } from './note';
import type { User, UserFilter, PaginatedUsersResponse } from './user';

export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

export interface ApiError {
  message: string;
  status: number;
  data?: any;
}

export interface ApiConfig {
  baseURL: string;
  headers?: Record<string, string>;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AuthResponse {
  token: string;
  data: {
    _id: string;
    name: string;
    email: string;
    username: string;
    role: string;
  };
}

export interface StudyCompletionResponse {
  xpEarned: number;
  currentStreak: number;
  level: number;
  awardedBadges: any[];
  newBadgeCount: number;
}

export interface ApiClient {
  get: <T>(url: string, config?: ApiConfig) => Promise<ApiResponse<T>>;
  post: <T>(url: string, data?: any, config?: ApiConfig) => Promise<ApiResponse<T>>;
  put: <T>(url: string, data?: any, config?: ApiConfig) => Promise<ApiResponse<T>>;
  delete: <T>(url: string, config?: ApiConfig) => Promise<ApiResponse<T>>;
}

export interface NoteApi {
  getNotes: (filters?: NoteFilter) => Promise<ApiResponse<PaginatedNotesResponse>>;
  getNote: (id: string) => Promise<ApiResponse<Note>>;
  createNote: (data: Partial<Note>) => Promise<ApiResponse<Note>>;
  updateNote: (id: string, data: Partial<Note>) => Promise<ApiResponse<Note>>;
  deleteNote: (id: string) => Promise<ApiResponse<void>>;
  rateNote: (id: string, rating: number) => Promise<ApiResponse<Note>>;
  generateSummary: (id: string) => Promise<ApiResponse<Note>>;
  generateFlashcards: (id: string) => Promise<ApiResponse<Note>>;
}

export interface UserApi {
  getUsers: (filters?: UserFilter) => Promise<ApiResponse<PaginatedUsersResponse>>;
  getUser: (id: string) => Promise<ApiResponse<User>>;
  updateUser: (id: string, data: Partial<User>) => Promise<ApiResponse<User>>;
  deleteUser: (id: string) => Promise<ApiResponse<void>>;
  getProfile: () => Promise<ApiResponse<User>>;
  updateProfile: (data: Partial<User>) => Promise<ApiResponse<User>>;
  getActivity: (userId: string) => Promise<ApiResponse<User['activity']>>;
  getBadges: (userId: string) => Promise<ApiResponse<User['badges']>>;
} 
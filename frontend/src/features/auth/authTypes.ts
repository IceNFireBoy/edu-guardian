export interface User {
  _id: string;
  name: string;
  email: string;
  username?: string;
  role: 'user' | 'admin';
  xp: number;
  level: number;
  profileImage?: string;
  biography?: string;
  emailVerified: boolean;
  createdAt: string;
  streak?: {
    current: number;
    max: number;
    lastUsed: Date;
  };
  aiUsage?: {
    summaryUsed: number;
    flashcardUsed: number;
    lastReset: Date;
    totalSummariesGenerated?: number;
    totalFlashcardsGenerated?: number;
  };
  preferences?: {
    darkMode?: boolean;
    emailNotifications?: boolean;
  };
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  name: string;
  email: string;
  password: string;
  username?: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

export interface AuthResponse {
  success: boolean;
  token: string;
  user: User;
} 
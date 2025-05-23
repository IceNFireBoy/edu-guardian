export interface User {
  name: string;
  email: string;
  xp: number;
  level: number;
  badges: string[];
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
}

export interface TokenPayload {
  userId: string;
  email: string;
  exp: number;
} 
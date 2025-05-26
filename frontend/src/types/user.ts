import { Document } from 'mongoose';
import { IBadge, IUserBadge } from './badge';
import { INote } from './note';

export interface IUser extends Document {
  name: string;
  email: string;
  username: string;
  password: string;
  role: 'student' | 'teacher' | 'admin';
  xp: number;
  level: number;
  streak: number;
  lastActivity: Date;
  badges: IUserBadge[];
  favoriteNotes: INote[];
  activityLog: IUserActivity[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserActivity {
  type: string;
  description: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface IUserProfile {
  _id: string;
  name: string;
  username: string;
  role: string;
  xp: number;
  level: number;
  streak: number;
  badges: IUserBadge[];
  createdAt: Date;
}

export interface IUserStats {
  totalNotes: number;
  totalViews: number;
  totalRatings: number;
  averageRating: number;
  totalXP: number;
  currentLevel: number;
  currentStreak: number;
  longestStreak: number;
  badgesEarned: number;
}

export interface UserStreak {
  current: number;
  max: number;
  lastUsed: Date;
}

export interface AIUsage {
  summaryUsed: number;
  flashcardUsed: number;
  lastReset: Date;
}

export interface UserProfile {
  _id: string;
  email: string;
  username: string;
  xp: number;
  level: number;
  streak: UserStreak;
  aiUsage: AIUsage;
  badges: string[];
  createdAt: Date;
  updatedAt: Date;
  summaryQuota?: number;
  flashcardQuota?: number;
}

export interface UserStatsCardProps {
  xp: number;
  level: number;
  streak: UserStreak | undefined;
}

export interface CompleteStudyPayload {
  noteId: string;
  duration: number;
} 
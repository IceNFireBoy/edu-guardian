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
  lastUsed: string;
}

export interface AIUsage {
  summaryUsed: number;
  flashcardUsed: number;
  lastReset: string;
}

export interface UserProfile {
  _id: string;
  name: string;
  email: string;
  username: string;
  role: 'user' | 'admin';
  xp: number;
  level: number;
  streak: UserStreak;
  aiUsage: AIUsage;
  badges: UserBadge[];
  favoriteNotes: string[];
  createdAt: string;
  updatedAt: string;
  stats: UserStats;
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

export interface User {
  _id: string;
  name: string;
  email: string;
  username: string;
  role: 'user' | 'admin';
  xp: number;
  level: number;
  streak: UserStreak;
  aiUsage: AIUsage;
  badges: UserBadge[];
  favoriteNotes: string[];
  createdAt: string;
  updatedAt: string;
}

export interface UserBadge {
  _id: string;
  badge: string;
  earnedAt: string;
  level: 'bronze' | 'silver' | 'gold' | 'platinum';
  xpReward: number;
}

export interface UserActivity {
  _id: string;
  userId: string;
  action: string;
  description: string;
  timestamp: string;
  xpEarned: number;
  metadata: {
    noteId?: string;
    noteTitle?: string;
    streakDays?: number;
  };
}

export interface UserSubject {
  _id: string;
  name: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  topics: string[];
}

export interface UserProfile extends Omit<User, 'streak'> {
  streak: {
    current: number;
    max: number;
    lastUsed: string;
  };
}

export interface UserAchievement {
  _id: string;
  name: string;
  description: string;
  icon: string;
  xpReward: number;
  earnedAt: string;
}

export interface UserStats {
  totalNotes: number;
  totalViews: number;
  totalDownloads: number;
  totalRatings: number;
  averageRating: number;
  totalFlashcardsGenerated: number;
  totalStudyTime: number;
  totalStreakDays: number;
  totalXPEarned: number;
  totalBadgesEarned: number;
}

export interface UserProfileResponse {
  success: boolean;
  data: UserProfile;
}

export interface UserStatsResponse {
  success: boolean;
  data: UserStats;
}

export interface UserActivityResponse {
  success: boolean;
  data: {
    activities: UserActivity[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface UserBadgeResponse {
  success: boolean;
  data: {
    badges: UserBadge[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface UserFavoriteNotesResponse {
  success: boolean;
  data: {
    notes: string[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface UserSearchResponse {
  success: boolean;
  data: {
    users: UserProfile[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface UserResponse {
  success: boolean;
  data: UserProfile;
  error?: string;
  message?: string;
}

export interface StudyCompleteResponse {
  success: boolean;
  message: string;
  data: {
    xpEarned: number;
    currentStreak: number;
    level: number;
    awardedBadges: any[];
    newBadgeCount: number;
  };
  error?: string;
} 
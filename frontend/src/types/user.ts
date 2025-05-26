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

export interface User {
  _id: string;
  name: string;
  email: string;
  username: string;
  role: 'user' | 'publisher' | 'admin';
  profileImage: string;
  biography?: string;
  preferences: {
    darkMode: boolean;
    emailNotifications: boolean;
  };
  xp: number;
  level: number;
  streak: {
    current: number;
    max: number;
    lastUsed: string;
  };
  lastActive: string;
  badges: UserBadge[];
  activity: UserActivity[];
  subjects: UserSubject[];
  emailVerified: boolean;
  aiUsage: {
    summaryUsed: number;
    flashcardUsed: number;
    lastReset: string;
  };
  totalSummariesGenerated: number;
  totalFlashcardsGenerated: number;
  favoriteNotes: string[];
  createdAt: string;
  updatedAt: string;
}

export interface UserBadge {
  _id: string;
  badge: string;
  earnedAt: string;
  criteriaMet: string;
}

export interface UserActivity {
  _id: string;
  action: 'study' | 'comment' | 'upload' | 'download' | 'rate' | 'share' | 'login' | 'earn_badge' | 'earn_xp' | 'ai_summary_generated' | 'ai_flashcards_generated';
  description: string;
  xpEarned: number;
  timestamp: string;
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
  xp: number;
  level: number;
  streak: number;
  badges: number;
  notes: number;
  achievements: number;
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
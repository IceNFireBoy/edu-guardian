import { Types } from 'mongoose';
import { IBadge } from './Badge';

export interface IUserBadge {
  _id?: Types.ObjectId;
  badge: Types.ObjectId | IBadge;
  earnedAt: Date;
  criteriaMet: string;
}

export interface IUserActivity {
  action: string;
  description: string;
  xpEarned?: number;
  timestamp: Date;
}

export interface UserStreak {
  current: number;
  max: number;
  lastUsed: Date;
}

export interface IUser {
  _id?: Types.ObjectId;
  name: string;
  email: string;
  password: string;
  role: 'user' | 'admin';
  xp: number;
  badges: IUserBadge[];
  activity: IUserActivity[];
  aiStreak: number;
  lastAIUsage: Date;
  streak: UserStreak;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface LeaderboardQueryOptions {
  timeframe: 'daily' | 'weekly' | 'monthly' | 'allTime';
  category?: string;
  limit?: number;
} 
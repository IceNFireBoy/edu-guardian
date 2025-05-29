import type { Note } from './note';

export interface User {
  _id: string;
  name: string;
  email: string;
  username: string;
  role: 'user' | 'admin';
  xp: number;
  level: number;
  streak: {
    current: number;
    max: number;
    lastUsed: Date;
  };
  aiUsage: {
    summaryUsed: number;
    flashcardUsed: number;
    lastReset: Date;
  };
  badges: UserBadge[];
  favoriteNotes: string[];
  activity: UserActivity[];
  totalSummariesGenerated: number;
  totalFlashcardsGenerated: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserProfile extends User {
  stats?: UserStats;
}

export interface UserBadge {
  _id: string;
  badge: {
    name: string;
    description: string;
    icon: string;
    category: 'achievement' | 'milestone' | 'special';
    rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  };
  earnedAt: Date;
  criteriaMet: string;
}

export interface UserActivity {
  _id: string;
  action: string;
  description: string;
  timestamp: Date;
  xpEarned: number;
  metadata: Record<string, any>;
}

export interface UserStats {
  totalNotes: number;
  totalFlashcards: number;
  averageRating: number;
  badgesEarned: number;
  currentStreak: number;
  longestStreak: number;
  xpEarned: number;
  level: number;
}

export interface UserFilter {
  search?: string;
  role?: 'user' | 'admin';
  sortBy?: 'name' | 'level' | 'xp' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedUsersResponse {
  users: User[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
} 
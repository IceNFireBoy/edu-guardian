export interface AIUsage {
  summaryUsed: number;
  flashcardUsed: number;
  lastReset: Date;
}

export interface UserBadge {
  id: string;
  name: string;
  description: string;
  icon: string;
  level: 'bronze' | 'silver' | 'gold' | 'platinum';
  category: 'upload' | 'ai' | 'streak' | 'achievement';
  xpReward: number;
  earnedAt: string;
}

export interface UserStreak {
  current: number;
  max: number;
  lastUsed: Date;
}

export interface UserActivity {
  id: string;
  action: string;
  description: string;
  xpEarned: number;
  timestamp: Date;
}

export interface UserPreferences {
  darkMode: boolean;
  emailNotifications: boolean;
}

export interface UserProfile {
  _id: string;
  name: string;
  email: string;
  username: string;
  role: string;
  profileImage?: string;
  biography?: string;
  xp: number;
  level: number;
  streak: UserStreak;
  aiUsage: AIUsage;
  badges: UserBadge[];
  activity: UserActivity[];
  preferences: UserPreferences;
  createdAt: Date;
  emailVerified: boolean;
}

export interface CompleteStudyPayload {
  noteId: string;
  duration: number; // Study duration in minutes
  flashcardsReviewed?: number;
}
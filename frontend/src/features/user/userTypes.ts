export interface AIUsage {
  summaryUsed: number;
  flashcardUsed: number;
  lastReset: string;
}

export interface UserBadge {
  _id: string;
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
  lastUsed: string;
}

export interface UserActivity {
  _id: string;
  action: string;
  description: string;
  xpEarned: number;
  timestamp: string;
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
  role: 'user' | 'admin';
  xp: number;
  level: number;
  streak: UserStreak;
  aiUsage: AIUsage;
  profileImage?: string;
  biography?: string;
  preferences?: UserPreferences;
  badges: UserBadge[];
  activity: UserActivity[];
  subjects: string[];
  createdAt: string;
  updatedAt: string;
  emailVerified: boolean;
  favoriteNotes: string[];
  totalSummariesGenerated: number;
  totalFlashcardsGenerated: number;
  summaryQuota?: number;
  flashcardQuota?: number;
}

export interface CompleteStudyPayload {
  noteId: string;
  duration: number;
  pointsEarned: number;
}
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
  studiedNotes?: UserStudiedNote[];
}

/** Per-note study record carried on the profile */
export interface UserStudiedNote {
  note: string;
  lastStudiedAt: string;
  totalSeconds: number;
  timesStudied: number;
}

export interface CompleteStudyPayload {
  noteId: string;
  /** Seconds spent studying in this session */
  duration: number;
}

/** What the backend reports after logging a study session */
export interface StudyCompletionResult {
  xpEarned: number;
  streak: { current: number; max: number } | null;
  newBadges: unknown[];
  studiedNote: {
    noteId: string;
    timesStudied: number;
    totalSeconds: number;
  } | null;
}
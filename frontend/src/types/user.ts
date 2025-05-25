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
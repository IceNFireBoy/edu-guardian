export interface Achievement {
  _id: string;
  name: string;
  description: string;
  icon: string;
  xpReward: number;
  requirements: {
    type: 'upload' | 'ai' | 'streak' | 'achievement';
    count: number;
    period?: 'day' | 'week' | 'month' | 'all';
  };
  level: 'bronze' | 'silver' | 'gold' | 'platinum';
  category: 'upload' | 'ai' | 'streak' | 'achievement';
  createdAt: string;
  updatedAt: string;
}

export interface UserAchievement {
  _id: string;
  achievement: Achievement;
  user: string;
  earnedAt: string;
  progress: number;
  completed: boolean;
}

export interface AchievementProgress {
  achievement: Achievement;
  progress: number;
  completed: boolean;
  earnedAt?: string;
} 
import { Document } from 'mongoose';

export interface Badge {
  _id: string;
  name: string;
  description: string;
  category: 'engagement' | 'ai' | 'streak' | 'achievement';
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  criteria: {
    type: string;
    threshold: number;
  };
  xpReward: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BadgeResponse {
  success: boolean;
  data: Badge;
  error?: string;
}

export interface BadgesResponse {
  success: boolean;
  data: Badge[];
  error?: string;
}

export interface IBadge extends Document {
  name: string;
  description: string;
  imageUrl: string;
  category: 'achievement' | 'engagement' | 'level' | 'streak';
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  criteria: {
    type: string;
    threshold: number;
  };
  xpReward: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserBadge {
  badge: IBadge;
  earnedAt: Date;
  criteriaMet: {
    type: string;
    value: number;
  };
}

export interface BadgeGridProps {
  badges: IUserBadge[];
  newBadgeIds: string[];
  className?: string;
} 
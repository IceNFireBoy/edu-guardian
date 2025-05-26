import { Document } from 'mongoose';

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
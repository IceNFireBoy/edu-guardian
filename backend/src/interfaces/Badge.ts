import { Types } from 'mongoose';

export interface IBadge {
  _id?: Types.ObjectId;
  name: string;
  description: string;
  category: 'achievement' | 'streak' | 'engagement' | 'ai';
  criteria: {
    type: string;
    threshold: number;
  };
  xpReward: number;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  isActive: boolean;
  displayOrder: number;
  createdAt?: Date;
  updatedAt?: Date;
} 
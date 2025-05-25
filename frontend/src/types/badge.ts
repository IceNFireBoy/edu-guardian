export interface Badge {
  _id: string;
  name: string;
  description: string;
  imageUrl: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  category: string;
  requirements: {
    type: string;
    value: number;
  };
  xpReward: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserBadge extends Badge {
  earnedAt: Date;
  progress?: number;
}

export interface BadgeGridProps {
  badges: UserBadge[];
  newBadgeIds: string[];
  className?: string;
} 
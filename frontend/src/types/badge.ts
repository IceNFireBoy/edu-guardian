import { Document } from 'mongoose';

export interface Badge {
  _id: string;
  name: string;
  description: string;
  icon: string;
  category: 'achievement' | 'engagement' | 'study' | 'social';
  level: 'bronze' | 'silver' | 'gold' | 'platinum';
  criteria: {
    type: string;
    value: number;
  };
  xpReward: number;
  createdAt: string;
  updatedAt: string;
}

export interface BadgeResponse {
  success: boolean;
  data: Badge;
}

export interface BadgesResponse {
  success: boolean;
  data: {
    badges: Badge[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface BadgeGridProps {
  badges: Badge[];
  userBadges?: string[];
  onBadgeClick?: (badge: Badge) => void;
  className?: string;
}

export interface BadgeCardProps {
  badge: Badge;
  isEarned?: boolean;
  onClick?: () => void;
  className?: string;
}

export interface BadgeProgressProps {
  badge: Badge;
  progress: number;
  className?: string;
}

export interface BadgeCriteria {
  type: string;
  value: number;
  description: string;
}

export interface BadgeLevel {
  level: 'bronze' | 'silver' | 'gold' | 'platinum';
  xpReward: number;
  criteria: BadgeCriteria;
}

export interface BadgeCategory {
  name: 'achievement' | 'engagement' | 'study' | 'social';
  description: string;
  icon: string;
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
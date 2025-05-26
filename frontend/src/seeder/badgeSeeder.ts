import { Badge } from '../models/Badge';
import { IBadge } from '../models/Badge';

interface BadgeSeedData extends Omit<Partial<IBadge>, 'createdAt' | 'updatedAt'> {
  name: string;
  description: string;
  category: 'streak' | 'engagement' | 'ai' | 'achievement';
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  criteria: {
    type: string;
    threshold: number;
  };
  xpReward: number;
}

const badgeData: BadgeSeedData[] = [
  {
    name: 'First Note',
    description: 'Upload your first note',
    category: 'achievement',
    rarity: 'common',
    criteria: {
      type: 'note_count',
      threshold: 1
    },
    xpReward: 100
  },
  {
    name: 'Note Master',
    description: 'Upload 10 notes',
    category: 'achievement',
    rarity: 'uncommon',
    criteria: {
      type: 'note_count',
      threshold: 10
    },
    xpReward: 500
  },
  {
    name: 'Streak Starter',
    description: 'Maintain a 3-day study streak',
    category: 'streak',
    rarity: 'common',
    criteria: {
      type: 'streak_days',
      threshold: 3
    },
    xpReward: 200
  },
  {
    name: 'Streak Master',
    description: 'Maintain a 7-day study streak',
    category: 'streak',
    rarity: 'rare',
    criteria: {
      type: 'streak_days',
      threshold: 7
    },
    xpReward: 1000
  },
  {
    name: 'Social Butterfly',
    description: 'Share 5 notes with the community',
    category: 'engagement',
    rarity: 'uncommon',
    criteria: {
      type: 'shared_notes',
      threshold: 5
    },
    xpReward: 300
  },
  {
    name: 'AI Explorer',
    description: 'Use AI features 10 times',
    category: 'ai',
    rarity: 'uncommon',
    criteria: {
      type: 'ai_usage',
      threshold: 10
    },
    xpReward: 400
  }
];

export async function seedBadges() {
  try {
    // Clear existing badges
    await Badge.deleteMany({});

    // Insert new badges
    const badges = await Badge.insertMany(badgeData);
    console.log(`Seeded ${badges.length} badges`);
  } catch (error) {
    console.error('Error seeding badges:', error);
  }
} 
import mongoose from 'mongoose';
import { IBadge } from '../../models/Badge';

export const mockBadge = (overrides?: Partial<IBadge>): Partial<IBadge> => {
  const defaultBadge: Partial<IBadge> = {
    name: 'Test Badge',
    description: 'Test Description',
    imageUrl: 'https://example.com/badge.png',
    category: 'xp',
    rarity: 'common',
    isActive: true,
    criteria: {
      description: 'Test criteria',
      requirements: { count: 1 }
    },
    xpAward: 100,
    slug: 'test-badge',
    createdAt: new Date()
  };

  return { ...defaultBadge, ...overrides };
};

export const createTestBadge = async (overrides: Partial<IBadge> = {}): Promise<IBadge & { _id: mongoose.Types.ObjectId }> => {
  const Badge = mongoose.model<IBadge>('Badge');
  const badge = new Badge({
    ...mockBadge(),
    ...overrides
  });
  await badge.save();
  return badge as IBadge & { _id: mongoose.Types.ObjectId };
}; 
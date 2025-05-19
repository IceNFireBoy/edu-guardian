// jest-ignore
import Badge, { IBadge } from '../../models/Badge';
import mongoose from 'mongoose';

export const mockBadge = (overrides: Partial<IBadge> = {}): Partial<IBadge> => ({
  _id: new mongoose.Types.ObjectId(),
  name: 'Test Badge',
  description: 'Test badge description',
  imageUrl: 'test-image.jpg',
  category: 'achievement',
  rarity: 'common',
  criteria: {
    description: 'Test criteria description',
    requirements: {
      count: 1
    }
  },
  xpAward: 100,
  isActive: true,
  slug: 'test-badge',
  xpReward: 100,
  requirements: {
    count: 1
  },
  ...overrides
});

export const mockTestBadge = async (overrides: Partial<IBadge> = {}): Promise<IBadge> => {
  const badgeData = mockBadge(overrides);
  const badge = new Badge(badgeData);
  return badge.save();
}; 
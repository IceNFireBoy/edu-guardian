// NOTE: This file is a factory, not a test suite. It should not be picked up by Jest.
// All code commented out to prevent Jest from running it as a test suite.
// (No test or describe blocks should be present)
import mongoose from 'mongoose';
// import { IBadge } from '../../models/Badge';

/**
 * @param {Partial<IBadge>} [overrides]
 * @returns {Partial<IBadge>}
 */
export const mockBadge = (overrides = {}) => {
  const defaultBadge = {
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

/**
 * @param {Partial<IBadge>} [overrides]
 * @returns {Promise<IBadge & {_id: mongoose.Types.ObjectId}>}
 */
export const createTestBadge = async (overrides = {}) => {
  const Badge = mongoose.model('Badge');
  const badge = new Badge({
    ...mockBadge(),
    ...overrides
  });
  await badge.save();
  return badge;
}; 
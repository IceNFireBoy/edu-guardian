import { IBadge } from '../../../models/Badge';

export const createBadge = (overrides: Partial<IBadge> = {}): IBadge => ({
  _id: 'test-badge-id',
  name: 'Test Badge',
  description: 'Test Badge Description',
  imageUrl: 'https://example.com/badge.png',
  category: 'achievement',
  rarity: 'common',
  criteria: {
    type: 'note_count',
    threshold: 5
  },
  xpReward: 100,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides
});

export const createUserBadge = (overrides: Partial<{ badge: IBadge; earnedAt: Date; criteriaMet: string }> = {}) => ({
  badge: createBadge(),
  earnedAt: new Date(),
  criteriaMet: 'Test criteria met',
  ...overrides
}); 
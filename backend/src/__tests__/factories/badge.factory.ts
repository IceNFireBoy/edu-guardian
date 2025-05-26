// jest-ignore
import { Badge } from '../../models/Badge';
import { IBadge } from '../../interfaces/Badge';
import { Types } from 'mongoose';

export const mockBadge = (): Partial<IBadge> => ({
  name: 'Test Badge',
  description: 'A test badge',
  category: 'achievement',
  criteria: {
    type: 'note_created',
    threshold: 1
  },
  xpReward: 100,
  rarity: 'common',
  isActive: true,
  displayOrder: 1,
  createdAt: new Date(),
  updatedAt: new Date()
});

export const mockTestBadge = async (): Promise<IBadge> => {
  const badge = new Badge(mockBadge());
  const savedBadge = await badge.save();
  return {
    ...savedBadge.toObject(),
    _id: savedBadge._id as Types.ObjectId,
    displayOrder: 1
  };
}; 
import mongoose from 'mongoose';
import { IBadge } from '../../models/Badge'; // Adjust path as necessary

const createObjectId = () => new mongoose.Types.ObjectId().toString();

export const mockBadge = (overrides?: Partial<IBadge>): IBadge => {
  const defaultBadge: IBadge = {
    _id: createObjectId(),
    name: 'Test Badge',
    description: 'This is a test badge.',
    icon: 'test-badge-icon.svg',
    category: 'achievement',
    requirements: { type: 'test_requirement', value: 1 },
    xpReward: 50,
    rarity: 'common',
    level: 'bronze',
    isActive: true,
    displayOrder: 1,
    slug: 'test-badge',
    createdAt: new Date(),
    // Document properties
    id: '', // will be set below
    save: jest.fn().mockResolvedValue(this),
    toObject: jest.fn().mockReturnValue(this),
    toJSON: jest.fn().mockReturnValue(this),
    isModified: jest.fn().mockReturnValue(false),
  } as any;

  const mergedBadge = { ...defaultBadge, ...overrides };
  mergedBadge.id = mergedBadge._id.toString();
  if (!overrides?.slug && overrides?.name) { // Auto-generate slug if name is overridden but slug isn't
    mergedBadge.slug = overrides.name.toLowerCase().replace(/\s+/g, '-');
  }

  return mergedBadge as IBadge;
}; 
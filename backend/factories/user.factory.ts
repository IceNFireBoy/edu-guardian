// NOTE: This file is a factory, not a test suite. It should not be picked up by Jest.
// All code commented out to prevent Jest from running it as a test suite.
// (No test or describe blocks should be present)
import mongoose from 'mongoose';
// import { IUser, IUserBadge, IUserActivity } from '../../models/User';

const createObjectId = () => new mongoose.Types.ObjectId();

/**
 * @param {Partial<IUserActivity>} [overrides]
 * @returns {IUserActivity}
 */
export const mockUserActivity = (overrides = {}) => ({
  action: 'login',
  description: 'User logged in',
  xpEarned: 10,
  timestamp: new Date(),
  ...overrides
});

/**
 * @param {Partial<IUserBadge>} [overrides]
 * @returns {IUserBadge}
 */
export const mockUserBadge = (overrides = {}) => ({
  badge: createObjectId(),
  earnedAt: new Date(),
  criteriaMet: 'test',
  ...overrides
});

/**
 * @param {Partial<IUser>} [overrides]
 * @returns {Partial<IUser>}
 */
export const mockUser = (overrides = {}) => {
  const defaultUser = {
    name: 'Test User',
    email: 'test@example.com',
    username: 'testuser',
    role: 'user',
    password: 'password123',
    profileImage: 'no-photo.jpg',
    biography: 'Test biography',
    preferences: {
      darkMode: false,
      emailNotifications: true
    },
    xp: 0,
    level: 1,
    streak: {
      current: 0,
      max: 0,
      lastUsed: new Date()
    },
    lastActive: new Date(),
    badges: [],
    activity: [],
    subjects: [],
    emailVerified: true,
    aiUsage: {
      summaryUsed: 0,
      flashcardUsed: 0,
      lastReset: new Date()
    },
    totalSummariesGenerated: 0,
    totalFlashcardsGenerated: 0,
    favoriteNotes: [],
    createdAt: new Date(),
    updatedAt: new Date()
  };
  return { ...defaultUser, ...overrides };
};

/**
 * @param {Partial<IUser>} [overrides]
 * @returns {Promise<IUser & {_id: mongoose.Types.ObjectId}>}
 */
export const createTestUser = async (overrides = {}) => {
  const User = mongoose.model('User');
  const user = new User({
    ...mockUser(),
    ...overrides
  });
  await user.save();
  return user;
}; 
// jest-ignore
import { IUser, IUserActivity, IUserBadge } from '../../models/User';
import mongoose from 'mongoose';

export const mockUser = (overrides: Partial<IUser> = {}): Partial<IUser> => ({
  name: 'Test User',
  email: 'test@example.com',
  username: 'testuser',
  role: 'user',
  password: 'password123',
  profileImage: 'default.jpg',
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
  emailVerified: false,
  aiUsage: {
    summaryUsed: 0,
    flashcardUsed: 0,
    lastReset: new Date()
  },
  totalSummariesGenerated: 0,
  totalFlashcardsGenerated: 0,
  favoriteNotes: [],
  ...overrides
});

export const mockUserActivity = (overrides: Partial<IUserActivity> = {}): Partial<IUserActivity> => ({
  _id: new mongoose.Types.ObjectId(),
  action: 'login',
  description: 'Test activity',
  xpEarned: 0,
  timestamp: new Date(),
  ...overrides
});

export const mockUserBadge = (overrides: Partial<IUserBadge> = {}): Partial<IUserBadge> => ({
  _id: new mongoose.Types.ObjectId(),
  badge: new mongoose.Types.ObjectId(),
  earnedAt: new Date(),
  criteriaMet: 'Test criteria',
  ...overrides
}); 
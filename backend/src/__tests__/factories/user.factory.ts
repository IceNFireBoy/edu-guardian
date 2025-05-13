import mongoose from 'mongoose';
import { IUser, IUserBadge, IUserActivity, IUserSubject } from '../../models/User'; // Adjust path as necessary

// Helper to generate a valid ObjectId string
const createObjectId = () => new mongoose.Types.ObjectId().toString();

export const mockUserActivity: IUserActivity = {
  action: 'login',
  description: 'User logged in',
  xpEarned: 10,
  createdAt: new Date()
};

export const mockUser: Partial<IUser> = {
  name: 'Test User',
  email: 'test@example.com',
  password: 'password123',
  role: 'user',
  xp: 0,
  level: 1,
  badges: [],
  activity: [mockUserActivity],
  favoriteNotes: [],
  aiUsage: {
    summaryUsed: 0,
    flashcardUsed: 0,
    lastReset: new Date()
  },
  streak: {
    current: 0,
    max: 0,
    lastUsed: new Date()
  },
  totalSummariesGenerated: 0,
  totalFlashcardsGenerated: 0,
  createdAt: new Date(),
  updatedAt: new Date()
};

export const createTestUser = async (overrides: Partial<IUser> = {}): Promise<IUser & { _id: mongoose.Types.ObjectId }> => {
  const User = mongoose.model<IUser>('User');
  const user = new User({
    ...mockUser,
    ...overrides
  });
  await user.save();
  return user as IUser & { _id: mongoose.Types.ObjectId };
};

export const mockUserBadge = (overrides?: Partial<IUserBadge>): IUserBadge => {
  const defaultBadge: IUserBadge = {
    _id: createObjectId(),
    badge: createObjectId() as any, // Assuming badge is ObjectId ref
    earnedAt: new Date(),
  } as any; // Cast to allow Document properties if IUserBadge extends Document
  return { ...defaultBadge, ...overrides } as IUserBadge;
}; 
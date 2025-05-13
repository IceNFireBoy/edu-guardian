import mongoose from 'mongoose';
import { IUser, IUserBadge, IUserActivity, IUserSubject } from '../../models/User'; // Adjust path as necessary

// Helper to generate a valid ObjectId string
const createObjectId = () => new mongoose.Types.ObjectId().toString();

export const mockUser = (overrides?: Partial<IUser>): IUser => {
  const defaultUser: IUser = {
    _id: createObjectId(),
    name: 'Test User',
    email: `testuser_${Date.now()}@example.com`, // Ensure unique email for tests
    username: `testuser_${Date.now()}`, // Ensure unique username
    role: 'user',
    password: 'password123', // Will be hashed by pre-save hook if actually saved
    profileImage: 'no-photo.jpg',
    biography: 'A test user biography.',
    preferences: {
      darkMode: false,
      emailNotifications: true,
    },
    xp: 100,
    level: 2,
    streak: {
      current: 1,
      max: 5,
      lastUsed: new Date(),
    },
    badges: [] as IUserBadge[],
    activity: [] as IUserActivity[],
    subjects: [] as IUserSubject[],
    emailVerified: true,
    aiUsage: {
      summaryUsed: 0,
      flashcardUsed: 0,
      lastReset: new Date(),
    },
    totalSummariesGenerated: 0,
    totalFlashcardsGenerated: 0,
    createdAt: new Date(),
    // --- Mongoose Document properties ---
    // These are part of the Document but not strictly IUser, 
    // but useful if interacting with Mongoose documents directly in tests
    // For IUser, methods are more relevant.
    
    // --- IUser Method Stubs ---
    // These are methods on the IUser interface. For mock objects, 
    // you'd typically mock their return values in the specific test
    // if they are called.
    getSignedJwtToken: jest.fn(() => 'mocked.jwt.token'),
    matchPassword: jest.fn(async (enteredPassword: string) => enteredPassword === 'password123'),
    getResetPasswordToken: jest.fn(() => 'mockedResetToken'),
    getEmailVerificationToken: jest.fn(() => 'mockedVerificationToken'),
    calculateLevel: jest.fn(function(this: IUser) { this.level = 1 + Math.floor(this.xp / 100); return this.level; }),
    updateStreak: jest.fn(function(this: IUser) { /* mock streak update logic if needed */ return this.streak.current; }),
    addActivity: jest.fn(function(this: IUser, action, description, xpEarned) {
      const newActivity = { action, description, xpEarned, createdAt: new Date(), _id: createObjectId() } as unknown as IUserActivity;
      this.activity.unshift(newActivity);
      if (xpEarned) this.xp += xpEarned;
      this.calculateLevel();
      return newActivity;
    }),

    // --- Document properties / methods that might be needed for type compatibility ---
    // These are often part of a Mongoose Document and might be expected by some utility functions
    // or if you're casting this mock to a full Document type.
    // If your IUser interface `extends Document`, these would be inherited.
    // For simplicity, I'm adding some common ones.
    
    // ensure an 'id' property which is common for mongoose docs (virtual of _id)
    id: '', // will be set below
    
    // Mongoose document methods (often not needed for plain object mocks unless specifically tested)
    save: jest.fn().mockResolvedValue(this),
    toObject: jest.fn(function(this: IUser) { 
      const obj = { ...this }; 
      delete obj.password; // Example: mimic model's toObject
      // remove jest.fn properties
      for (const key in obj) {
        if (typeof (obj as any)[key] === 'function' && (obj as any)[key].mock) {
          delete (obj as any)[key];
        }
      }
      return obj;
    }),
    toJSON: jest.fn(function(this: IUser) { 
      const obj = { ...this }; 
      delete obj.password;
      // remove jest.fn properties
      for (const key in obj) {
        if (typeof (obj as any)[key] === 'function' && (obj as any)[key].mock) {
          delete (obj as any)[key];
        }
      }
      return obj;
    }),
    isModified: jest.fn().mockReturnValue(false),
    // ... other Document methods as needed: populate, execPopulate, validate, etc.

    // If IUser extends Document, it has these. If not, they are extra.
    // Casting to `any` then `IUser` to satisfy the type for now.
  } as any; // Cast to any initially to allow Document properties

  const mergedUser = { ...defaultUser, ...overrides };
  mergedUser.id = mergedUser._id.toString(); // Ensure 'id' virtual is present

  // Re-assign method stubs to the mergedUser context if they were overridden
  // or to ensure they are part of the returned object with `this` bound correctly if needed.
  // For basic data mocks, this might be overkill unless methods are stateful based on other props.
  mergedUser.getSignedJwtToken = defaultUser.getSignedJwtToken;
  mergedUser.matchPassword = defaultUser.matchPassword;
  // ... and so on for other methods if their default stubs are complex or rely on `this` from defaultUser.

  return mergedUser as IUser;
};

export const mockUserActivity = (overrides?: Partial<IUserActivity>): IUserActivity => {
  const defaultActivity: IUserActivity = {
    _id: createObjectId(),
    action: 'login',
    description: 'User logged in',
    xpEarned: 10,
    createdAt: new Date(),
  } as any; // Cast to allow Document properties if IUserActivity extends Document
  return { ...defaultActivity, ...overrides } as IUserActivity;
};

export const mockUserBadge = (overrides?: Partial<IUserBadge>): IUserBadge => {
  const defaultBadge: IUserBadge = {
    _id: createObjectId(),
    badge: createObjectId() as any, // Assuming badge is ObjectId ref
    earnedAt: new Date(),
  } as any; // Cast to allow Document properties if IUserBadge extends Document
  return { ...defaultBadge, ...overrides } as IUserBadge;
}; 
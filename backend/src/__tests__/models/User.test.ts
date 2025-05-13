import User, { IUser } from '../../models/User';
import mongoose from 'mongoose';

describe('User Model', () => {
  let testUser: IUser;

  beforeEach(async () => {
    // Clear the users collection
    await User.deleteMany({});

    // Create a test user
    testUser = await User.create({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      username: 'testuser',
      role: 'user'
    });
  });

  describe('User Creation', () => {
    it('should create a user successfully', async () => {
      // Find the user explicitly excluding the password field
      const user = await User.findById(testUser._id);
      
      expect(user).toBeDefined();
      expect(user?.name).toBe('Test User');
      expect(user?.email).toBe('test@example.com');
      expect(user?.username).toBe('testuser');
      expect(user?.role).toBe('user');
      expect(user?.password).toBeUndefined(); // Password should not be returned
    });

    it('should not create user with duplicate email', async () => {
      await expect(
        User.create({
          name: 'Another User',
          email: 'test@example.com',
          password: 'password123',
          username: 'anotheruser',
          role: 'user'
        })
      ).rejects.toThrow();
    });

    it('should not create user with duplicate username', async () => {
      await expect(
        User.create({
          name: 'Another User',
          email: 'another@example.com',
          password: 'password123',
          username: 'testuser',
          role: 'user'
        })
      ).rejects.toThrow();
    });
  });

  describe('Password Hashing', () => {
    it('should hash password before saving', async () => {
      const user = await User.findOne({ email: 'test@example.com' }).select('+password');
      expect(user?.password).not.toBe('password123');
    });

    it('should match password correctly', async () => {
      const user = await User.findOne({ email: 'test@example.com' }).select('+password');
      const isMatch = await user?.matchPassword('password123');
      expect(isMatch).toBe(true);
    });

    it('should not match incorrect password', async () => {
      const user = await User.findOne({ email: 'test@example.com' }).select('+password');
      const isMatch = await user?.matchPassword('wrongpassword');
      expect(isMatch).toBe(false);
    });

    it('should handle null password case', async () => {
      const user = await User.findOne({ email: 'test@example.com' });
      // Simulate a user without password selected
      user!.password = undefined;
      const isMatch = await user?.matchPassword('anypassword');
      expect(isMatch).toBe(false);
    });
  });

  describe('JWT Token Generation', () => {
    it('should generate valid JWT token', () => {
      const token = testUser.getSignedJwtToken();
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
    });

    it('should throw error if JWT_SECRET is undefined', () => {
      const originalEnv = process.env.JWT_SECRET;
      delete process.env.JWT_SECRET;
      
      expect(() => {
        testUser.getSignedJwtToken();
      }).toThrow('JWT_SECRET not defined');
      
      process.env.JWT_SECRET = originalEnv;
    });
  });

  describe('Reset Password Token', () => {
    it('should generate reset password token', () => {
      const resetToken = testUser.getResetPasswordToken();
      expect(resetToken).toBeDefined();
      expect(typeof resetToken).toBe('string');
      expect(testUser.resetPasswordToken).toBeDefined();
      expect(testUser.resetPasswordExpire).toBeDefined();
      // Verify expiration date is in the future (10 minutes)
      const expireDate = testUser.resetPasswordExpire as Date;
      expect(expireDate.getTime()).toBeGreaterThan(Date.now());
      expect(expireDate.getTime()).toBeLessThan(Date.now() + 11 * 60 * 1000);
    });
  });

  describe('Email Verification Token', () => {
    it('should generate email verification token', () => {
      const verificationToken = testUser.getEmailVerificationToken();
      expect(verificationToken).toBeDefined();
      expect(typeof verificationToken).toBe('string');
      expect(testUser.emailVerificationToken).toBeDefined();
      expect(testUser.emailVerificationTokenExpire).toBeDefined();
      // Verify expiration date is in the future (24 hours)
      const expireDate = testUser.emailVerificationTokenExpire as Date;
      expect(expireDate.getTime()).toBeGreaterThan(Date.now());
      expect(expireDate.getTime()).toBeLessThan(Date.now() + 25 * 60 * 60 * 1000);
    });
  });

  describe('User Methods', () => {
    it('should calculate level based on XP', () => {
      testUser.xp = 150;
      const level = testUser.calculateLevel();
      expect(level).toBe(2);
    });

    it('should update streak correctly for consecutive day login', () => {
      // Mock the streak.lastActive to be one day ago
      const oneDayAgo = new Date();
      oneDayAgo.setDate(oneDayAgo.getDate() - 1);
      testUser.streak = {
        count: 0,
        lastActive: oneDayAgo
      };
      
      const streak = testUser.updateStreak();
      expect(streak).toBe(1);
      expect(testUser.currentStreak).toBe(1);
      expect(testUser.longestStreak).toBe(1);
    });

    it('should reset streak when more than one day passed', () => {
      // Set initial streak values
      testUser.currentStreak = 5;
      testUser.longestStreak = 10;
      
      // Mock lastActive to be three days ago
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      testUser.streak = {
        count: 5,
        lastActive: threeDaysAgo
      };
      
      const streak = testUser.updateStreak();
      expect(streak).toBe(1); // Reset to 1
      expect(testUser.currentStreak).toBe(1);
      expect(testUser.streak.count).toBe(1);
      expect(testUser.longestStreak).toBe(10); // Longest streak should remain unchanged
    });

    it('should handle consecutive days within same 24h window', () => {
      // Mock lastActive to be yesterday but within 24h
      const yesterday = new Date();
      yesterday.setHours(23, 59, 59);
      yesterday.setDate(yesterday.getDate() - 1);
      
      testUser.currentStreak = 2;
      testUser.streak = {
        count: 2,
        lastActive: yesterday
      };
      
      // Mock current time to be just after midnight
      const originalNow = Date.now;
      const mockNow = new Date();
      mockNow.setHours(0, 5, 0);
      global.Date.now = jest.fn(() => mockNow.getTime());
      
      const streak = testUser.updateStreak();
      
      // Restore original Date.now
      global.Date.now = originalNow;
      
      expect(streak).toBe(3); // Increased by 1
      expect(testUser.currentStreak).toBe(3);
    });

    it('should not increase streak for multiple actions on same day', () => {
      const today = new Date();
      testUser.currentStreak = 3;
      testUser.streak = {
        count: 3,
        lastActive: today
      };
      
      const streak = testUser.updateStreak();
      expect(streak).toBe(3); // Remains unchanged
      expect(testUser.currentStreak).toBe(3);
    });

    it('should update longest streak when current streak exceeds it', () => {
      testUser.currentStreak = 10;
      testUser.longestStreak = 9;
      
      // Mock lastActive to be one day ago
      const oneDayAgo = new Date();
      oneDayAgo.setDate(oneDayAgo.getDate() - 1);
      testUser.streak = {
        count: 10,
        lastActive: oneDayAgo
      };
      
      const streak = testUser.updateStreak();
      expect(streak).toBe(11);
      expect(testUser.longestStreak).toBe(11); // Updated to new longest streak
    });

    it('should handle missing lastActive date', () => {
      testUser.streak = {
        count: 0,
        lastActive: undefined as any
      };
      
      const streak = testUser.updateStreak();
      expect(streak).toBe(0); // Doesn't increase since it's treated as same day
      expect(testUser.streak.lastActive).toBeDefined(); // Should set a date
    });

    it('should add activity', () => {
      const activity = testUser.addActivity('login', 'User logged in', 10);
      expect(activity.action).toBe('login');
      expect(activity.description).toBe('User logged in');
      expect(activity.xpEarned).toBe(10);
      expect(testUser.xp).toBe(10);
    });

    it('should add activity with default values', () => {
      const activity = testUser.addActivity('upload');
      expect(activity.action).toBe('upload');
      expect(activity.description).toBe('');
      expect(activity.xpEarned).toBe(0);
      expect(testUser.xp).toBe(0); // No change to XP
    });

    it('should limit activity array to 100 items', () => {
      // Add 105 activities
      for (let i = 0; i < 105; i++) {
        testUser.addActivity('login', `Login ${i}`, 1);
      }
      
      expect(testUser.activity.length).toBe(100);
      expect(testUser.activity[0].description).toBe('Login 104'); // Most recent first
      expect(testUser.activity[99].description).toBe('Login 5'); // Oldest kept
    });

    it('should update XP and recalculate level', () => {
      testUser.xp = 90;
      testUser.level = 1;
      
      testUser.addActivity('upload', 'Document upload', 20);
      
      expect(testUser.xp).toBe(110);
      expect(testUser.level).toBe(2); // Level should increase
    });
  });

  describe('User Preferences', () => {
    it('should have default preferences', () => {
      expect(testUser.preferences).toBeDefined();
      expect(testUser.preferences.darkMode).toBe(false);
      expect(testUser.preferences.emailNotifications).toBe(true);
    });

    it('should update preferences', async () => {
      testUser.preferences.darkMode = true;
      testUser.preferences.emailNotifications = false;
      await testUser.save();

      const updatedUser = await User.findById(testUser._id);
      expect(updatedUser?.preferences.darkMode).toBe(true);
      expect(updatedUser?.preferences.emailNotifications).toBe(false);
    });
  });

  describe('User Badges', () => {
    it('should add badge to user', async () => {
      const badgeId = new mongoose.Types.ObjectId();
      
      // Use direct MongoDB update instead of model methods to bypass schema validation
      await User.findByIdAndUpdate(
        testUser._id,
        { 
          $push: { 
            badges: {
              badge: badgeId,
              earnedAt: new Date()
            } 
          } 
        }
      );

      const updatedUser = await User.findById(testUser._id);
      expect(updatedUser?.badges).toHaveLength(1);
      expect(updatedUser?.badges[0].badge.toString()).toBe(badgeId.toString());
    });
  });
}); 
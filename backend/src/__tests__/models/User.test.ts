import mongoose from 'mongoose';
import User, { IUser, IUserSubject } from '../../models/User';
import { mockUser, mockUserActivity, mockUserBadge } from '../factories/user.factory';

describe('User Model Test', () => {
  beforeAll(async () => {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/test');
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await User.deleteMany({});
  });

  it('should create & save user successfully', async () => {
    const validUser = {
      name: 'Test User',
      email: 'test@example.com',
      username: 'testuser',
      password: 'password123',
      role: 'user',
      subjects: [
        {
          name: 'Math',
          level: 'Intermediate',
          topics: ['Algebra', 'Calculus']
        },
        {
          name: 'Science',
          level: 'Beginner',
          topics: ['Physics', 'Chemistry']
        }
      ]
    };

    const savedUser = await User.create(validUser);
    expect(savedUser._id).toBeDefined();
    expect(savedUser.name).toBe(validUser.name);
    expect(savedUser.email).toBe(validUser.email);
    expect(savedUser.username).toBe(validUser.username);
    expect(savedUser.password).not.toBe(validUser.password); // Password should be hashed
    expect(savedUser.role).toBe(validUser.role);
    expect(savedUser.subjects).toHaveLength(2);
    expect(savedUser.subjects[0].name).toBe('Math');
    expect(savedUser.subjects[1].name).toBe('Science');
  });

  it('should fail to save user without required fields', async () => {
    const userWithoutRequiredField = new User({ name: 'Test User' });
    let err: any;

    try {
      await userWithoutRequiredField.save();
    } catch (error) {
      err = error;
    }

    expect(err).toBeDefined();
    expect(err.errors.email).toBeDefined();
    expect(err.errors.username).toBeDefined();
    expect(err.errors.password).toBeDefined();
  });

  it('should fail to save user with invalid email', async () => {
    const userWithInvalidEmail = new User({
      name: 'Test User',
      email: 'invalid-email',
      username: 'testuser',
      password: 'password123'
    });

    let err: any;
    try {
      await userWithInvalidEmail.save();
    } catch (error) {
      err = error;
    }

    expect(err).toBeDefined();
    expect(err.errors.email).toBeDefined();
  });

  it('should fail to save user with duplicate email', async () => {
    const user1 = await User.create({
      name: 'Test User 1',
      email: 'test@example.com',
      username: 'testuser1',
      password: 'password123'
    });

    const user2 = new User({
      name: 'Test User 2',
      email: 'test@example.com',
      username: 'testuser2',
      password: 'password123'
    });

    let err: any;
    try {
      await user2.save();
    } catch (error) {
      err = error;
    }

    expect(err).toBeDefined();
    expect(err.code).toBe(11000);
  });

  it('should fail to save user with duplicate username', async () => {
    const user1 = await User.create({
      name: 'Test User 1',
      email: 'test1@example.com',
      username: 'testuser',
      password: 'password123'
    });

    const user2 = new User({
      name: 'Test User 2',
      email: 'test2@example.com',
      username: 'testuser',
      password: 'password123'
    });

    let err: any;
    try {
      await user2.save();
    } catch (error) {
      err = error;
    }

    expect(err).toBeDefined();
    expect(err.code).toBe(11000);
  });

  it('should hash password before saving', async () => {
    const user = await User.create({
      name: 'Test User',
      email: 'test@example.com',
      username: 'testuser',
      password: 'password123'
    });

    expect(user.password).not.toBe('password123');
    expect(user.password).toMatch(/^\$2[aby]\$\d+\$/); // bcrypt hash format
  });

  it('should match password correctly', async () => {
    const user = await User.create({
      name: 'Test User',
      email: 'test@example.com',
      username: 'testuser',
      password: 'password123'
    });

    const isMatch = await user.matchPassword('password123');
    expect(isMatch).toBe(true);

    const isNotMatch = await user.matchPassword('wrongpassword');
    expect(isNotMatch).toBe(false);
  });

  it('should generate JWT token', async () => {
    const user = await User.create({
      name: 'Test User',
      email: 'test@example.com',
      username: 'testuser',
      password: 'password123'
    });

    const token = user.getSignedJwtToken();
    expect(token).toBeDefined();
    expect(typeof token).toBe('string');
  });

  it('should generate reset password token', async () => {
    const user = await User.create({
      name: 'Test User',
      email: 'test@example.com',
      username: 'testuser',
      password: 'password123'
    });

    const resetToken = user.getResetPasswordToken();
    expect(resetToken).toBeDefined();
    expect(user.resetPasswordToken).toBeDefined();
    expect(user.resetPasswordExpire).toBeDefined();
  });

  it('should generate email verification token', async () => {
    const user = await User.create({
      name: 'Test User',
      email: 'test@example.com',
      username: 'testuser',
      password: 'password123'
    });

    const verificationToken = user.getEmailVerificationToken();
    expect(verificationToken).toBeDefined();
    expect(user.emailVerificationToken).toBeDefined();
    expect(user.emailVerificationTokenExpire).toBeDefined();
  });

  it('should calculate user level based on XP', async () => {
    const user = await User.create({
      name: 'Test User',
      email: 'test@example.com',
      username: 'testuser',
      password: 'password123',
      xp: 0
    });

    expect(user.level).toBe(1);

    user.xp = 100;
    await user.save();
    expect(user.level).toBe(2);

    user.xp = 500;
    await user.save();
    expect(user.level).toBe(3);
  });

  it('should update user streak', async () => {
    const user = await User.create({
      name: 'Test User',
      email: 'test@example.com',
      username: 'testuser',
      password: 'password123'
    });

    await user.updateStreak();
    expect(user.streak.current).toBe(1);
    expect(user.streak.longest).toBe(1);

    await user.updateStreak();
    expect(user.streak.current).toBe(2);
    expect(user.streak.longest).toBe(2);

    // Simulate streak break
    user.streak.lastLogin = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000); // 2 days ago
    await user.save();
    await user.updateStreak();
    expect(user.streak.current).toBe(1);
    expect(user.streak.longest).toBe(2);
  });

  it('should add user activity', async () => {
    const user = await User.create({
      name: 'Test User',
      email: 'test@example.com',
      username: 'testuser',
      password: 'password123'
    });

    await user.addActivity('login', 'User logged in');
    expect(user.activity).toHaveLength(1);
    expect(user.activity[0].action).toBe('login');
    expect(user.activity[0].description).toBe('User logged in');

    await user.addActivity('note_created', 'Created a new note', 10);
    expect(user.activity).toHaveLength(2);
    expect(user.activity[1].action).toBe('note_created');
    expect(user.activity[1].description).toBe('Created a new note');
    expect(user.activity[1].xpEarned).toBe(10);
    expect(user.xp).toBe(10);
  });

  it('should add activity to user', async () => {
    const user = await User.create(mockUser());
    const activity = mockUserActivity();
    user.activity.push(activity as any);
    const updatedUser = await user.save();
    expect(updatedUser?.activity).toHaveLength(1);
    expect(updatedUser?.activity[0].action).toBe(activity.action);
  });

  it('should add badge to user', async () => {
    const user = await User.create(mockUser());
    const badge = mockUserBadge();
    user.badges.push(badge as any);
    const updatedUser = await user.save();
    expect(updatedUser?.badges).toHaveLength(1);
    expect(updatedUser?.badges[0].criteriaMet).toBe(badge.criteriaMet);
  });

  it('should update AI usage', async () => {
    const user = await User.create(mockUser());
    user.aiUsage.summaryUsed = 5;
    user.aiUsage.flashcardUsed = 3;
    const updatedUser = await user.save();
    expect(updatedUser?.aiUsage.summaryUsed).toBe(5);
    expect(updatedUser?.aiUsage.flashcardUsed).toBe(3);
  });

  it('should update streak', async () => {
    const user = await User.create(mockUser());
    user.streak.current = 5;
    user.streak.max = 10;
    const updatedUser = await user.save();
    expect(updatedUser?.streak.current).toBe(5);
    expect(updatedUser?.streak.max).toBe(10);
  });

  // New test cases to improve coverage
  it('should validate username format', async () => {
    const userWithInvalidUsername = mockUser({ username: 'a' }); // Too short
    let err;
    try {
      await User.create(userWithInvalidUsername);
    } catch (error) {
      err = error;
    }
    expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
  });

  it('should validate role enum', async () => {
    const userWithInvalidRole = mockUser({ role: 'invalid' as any });
    let err;
    try {
      await User.create(userWithInvalidRole);
    } catch (error) {
      err = error;
    }
    expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
  });

  it('should update user preferences', async () => {
    const user = await User.create(mockUser());
    user.preferences.darkMode = true;
    user.preferences.emailNotifications = false;
    const updatedUser = await user.save();
    expect(updatedUser?.preferences.darkMode).toBe(true);
    expect(updatedUser?.preferences.emailNotifications).toBe(false);
  });

  it('should update user profile', async () => {
    const user = await User.create(mockUser());
    user.profileImage = 'new-image.jpg';
    user.biography = 'Updated biography';
    const updatedUser = await user.save();
    expect(updatedUser?.profileImage).toBe('new-image.jpg');
    expect(updatedUser?.biography).toBe('Updated biography');
  });

  it('should update user subjects', async () => {
    const user = await User.create(mockUser());
    user.subjects = [{
      name: 'Math',
      level: 'Beginner',
      topics: ['Algebra']
    }, {
      name: 'Science',
      level: 'Intermediate',
      topics: ['Physics', 'Chemistry']
    }];
    const updatedUser = await user.save();
    expect(updatedUser?.subjects).toHaveLength(2);
    expect(updatedUser?.subjects[0].name).toBe('Math');
    expect(updatedUser?.subjects[1].name).toBe('Science');
  });

  it('should update user XP and level', async () => {
    const user = await User.create(mockUser());
    user.xp = 1000;
    user.level = 5;
    const updatedUser = await user.save();
    expect(updatedUser?.xp).toBe(1000);
    expect(updatedUser?.level).toBe(5);
  });

  it('should update last active timestamp', async () => {
    const user = await User.create(mockUser());
    const newDate = new Date();
    user.lastActive = newDate;
    const updatedUser = await user.save();
    expect(updatedUser?.lastActive).toEqual(newDate);
  });

  it('should update email verification status', async () => {
    const user = await User.create(mockUser());
    user.emailVerified = true;
    const updatedUser = await user.save();
    expect(updatedUser?.emailVerified).toBe(true);
  });

  it('should update favorite notes', async () => {
    const user = await User.create(mockUser());
    const noteId = new mongoose.Types.ObjectId();
    user.favoriteNotes.push(noteId);
    const updatedUser = await user.save();
    expect(updatedUser?.favoriteNotes).toHaveLength(1);
    expect(updatedUser?.favoriteNotes[0].toString()).toBe(noteId.toString());
  });

  it('should update total AI usage counts', async () => {
    const user = await User.create(mockUser());
    user.totalSummariesGenerated = 10;
    user.totalFlashcardsGenerated = 20;
    const updatedUser = await user.save();
    expect(updatedUser?.totalSummariesGenerated).toBe(10);
    expect(updatedUser?.totalFlashcardsGenerated).toBe(20);
  });
}); 
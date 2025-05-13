import mongoose from 'mongoose';
import { User, IUser } from '../../models/User';

describe('User Model Test', () => {
  beforeAll(async () => {
    await mongoose.connect(process.env.MONGODB_URI_TEST || 'mongodb://localhost:27017/eduguardian_test');
  });

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await User.deleteMany({});
  });

  it('should create & save user successfully', async () => {
    const validUser = new User({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      role: 'user',
      xp: 0,
      level: 1,
      badges: [],
      activity: [],
      favoriteNotes: [],
      aiUsage: {
        current: 0,
        max: 10,
        lastUsed: new Date()
      },
      streak: {
        current: 0,
        max: 0,
        lastUsed: new Date()
      },
      totalSummariesGenerated: 0,
      totalFlashcardsGenerated: 0
    });

    const savedUser = await validUser.save();
    expect(savedUser._id).toBeDefined();
    expect(savedUser.name).toBe(validUser.name);
    expect(savedUser.email).toBe(validUser.email);
    expect(savedUser.password).not.toBe(validUser.password); // Password should be hashed
  });

  it('should fail to save user without required fields', async () => {
    const userWithoutRequiredField = new User({ name: 'Test User' });
    let err;
    try {
      await userWithoutRequiredField.save();
    } catch (error) {
      err = error;
    }
    expect(err).toBeDefined();
  });

  it('should update user streak correctly', async () => {
    const testUser = new User({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      role: 'user',
      xp: 0,
      level: 1,
      badges: [],
      activity: [],
      favoriteNotes: [],
      aiUsage: {
        current: 0,
        max: 10,
        lastUsed: new Date()
      },
      streak: {
        current: 0,
        max: 0,
        lastUsed: new Date()
      },
      totalSummariesGenerated: 0,
      totalFlashcardsGenerated: 0
    });

    await testUser.save();

    // Test first login of the day
    testUser.streak.current = 0;
    testUser.streak.lastUsed = new Date(Date.now() - 24 * 60 * 60 * 1000); // Yesterday
    await testUser.save();

    expect(testUser.streak.current).toBe(1);
    expect(testUser.streak.max).toBe(1);

    // Test consecutive login
    testUser.streak.current = 5;
    testUser.streak.max = 10;
    await testUser.save();

    expect(testUser.streak.current).toBe(1);
    expect(testUser.streak.max).toBe(10); // Max streak should remain unchanged

    // Test breaking streak
    testUser.streak.current = 2;
    testUser.streak.lastUsed = new Date(Date.now() - 48 * 60 * 60 * 1000); // 2 days ago
    await testUser.save();

    expect(testUser.streak.current).toBe(3);

    // Test updating longest streak
    testUser.streak.current = 3;
    testUser.streak.lastUsed = new Date(Date.now() - 24 * 60 * 60 * 1000);
    await testUser.save();

    expect(testUser.streak.current).toBe(3);

    // Test breaking streak after long time
    testUser.streak.current = 10;
    testUser.streak.max = 9;
    testUser.streak.lastUsed = new Date(Date.now() - 72 * 60 * 60 * 1000); // 3 days ago
    await testUser.save();

    expect(testUser.streak.max).toBe(11); // Updated to new longest streak
  });

  it('should add activity correctly', async () => {
    const testUser = new User({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      role: 'user',
      xp: 0,
      level: 1,
      badges: [],
      activity: [],
      favoriteNotes: [],
      aiUsage: {
        current: 0,
        max: 10,
        lastUsed: new Date()
      },
      streak: {
        current: 0,
        max: 0,
        lastUsed: new Date()
      },
      totalSummariesGenerated: 0,
      totalFlashcardsGenerated: 0
    });

    await testUser.save();

    // Test adding activity with XP
    testUser.addActivity('login', 'User logged in', 10);
    const activity = testUser.activity[0];
    expect(activity.action).toBe('login');
    expect(activity.description).toBe('User logged in');
    expect(activity.xpEarned).toBe(10);

    // Test adding activity without XP
    testUser.addActivity('upload', 'User uploaded a note');
    const uploadActivity = testUser.activity[1];
    expect(uploadActivity.action).toBe('upload');
    expect(uploadActivity.description).toBe('User uploaded a note');
    expect(uploadActivity.xpEarned).toBe(0);
  });
}); 
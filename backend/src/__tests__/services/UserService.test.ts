import mongoose from 'mongoose';
import UserService from '../../services/UserService';
import User, { IUser } from '../../models/User';
import { mockUser } from '../factories/user.factory';
import { AI_USAGE_LIMITS, QUOTA_RESET_HOURS, AI_USER_TIERS } from '../../config/aiConfig';
import { QuotaExceededError, NotFoundError } from '../../utils/customErrors';
import { UserService as UserServiceImport } from '../../../services/UserService';
import Note from '../../models/Note';
import { mockUserActivity } from '../factories/user.factory';
import { mockNote } from '../factories/note.factory';

// Mock the Date object to control time-based tests
const RealDate = Date;

function mockDate(isoDate: string) {
  global.Date = class extends RealDate {
    constructor(...args: any[]) {
      if (args.length) {
        // @ts-ignore
        super(...args);
      } else {
        super(isoDate);
      }
    }
    static now() {
      return new RealDate(isoDate).getTime();
    }
  } as any;
}


describe('UserService', () => {
  let userService: UserService;
  let testUser: IUser & { _id: mongoose.Types.ObjectId }; // For type safety with Mongoose doc

  beforeAll(() => {
    userService = new UserService();
  });

  beforeEach(async () => {
    // Clear users collection before each test
    await User.deleteMany({});
    await Note.deleteMany({});

    // Create a fresh user for each test, ensuring it's a Mongoose document
    const userDoc = new User(mockUser({
      aiUsage: {
        summaryUsed: 0,
        flashcardUsed: 0,
        lastReset: new RealDate('2023-01-01T00:00:00.000Z') // Known baseline
      },
      streak: {
        current: 0,
        max: 0,
        lastUsed: new RealDate('2023-01-01T00:00:00.000Z') // Known baseline
      }
    }));
    testUser = await userDoc.save() as IUser & { _id: mongoose.Types.ObjectId };
  });

  afterEach(() => {
    global.Date = RealDate; // Restore Date object
    jest.clearAllMocks();
  });

  describe('AI Quota Management', () => {
    describe('checkUserQuota', () => {
      it('should allow usage if quota is available', async () => {
        mockDate('2023-01-01T10:00:00.000Z'); // Within the same day as lastReset
        await expect(userService.checkUserQuota(testUser._id.toString(), 'summary')).resolves.not.toThrow();
      });

      it('should throw QuotaExceededError if summary quota is reached', async () => {
        mockDate('2023-01-01T10:00:00.000Z');
        testUser.aiUsage.summaryUsed = AI_USAGE_LIMITS.SUMMARY_PER_DAY;
        await testUser.save();
        await expect(userService.checkUserQuota(testUser._id.toString(), 'summary')).rejects.toThrow(QuotaExceededError);
      });

      it('should throw QuotaExceededError if flashcard quota is reached', async () => {
        mockDate('2023-01-01T10:00:00.000Z');
        testUser.aiUsage.flashcardUsed = AI_USAGE_LIMITS.FLASHCARDS_PER_DAY;
        await testUser.save();
        await expect(userService.checkUserQuota(testUser._id.toString(), 'flashcard')).rejects.toThrow(QuotaExceededError);
      });

      it('should reset quota if QUOTA_RESET_HOURS has passed', async () => {
        mockDate('2023-01-02T10:00:00.000Z'); // Next day, after reset hours
        testUser.aiUsage.summaryUsed = AI_USAGE_LIMITS.SUMMARY_PER_DAY;
        testUser.aiUsage.lastReset = new RealDate('2023-01-01T00:00:00.000Z');
        await testUser.save();

        await expect(userService.checkUserQuota(testUser._id.toString(), 'summary')).resolves.not.toThrow();
        
        const updatedUser = await User.findById(testUser._id);
        expect(updatedUser?.aiUsage.summaryUsed).toBe(0);
        expect(updatedUser?.aiUsage.lastReset.toISOString()).toBe('2023-01-02T10:00:00.000Z');
      });

      it('should not reset quota if QUOTA_RESET_HOURS has not passed', async () => {
        mockDate('2023-01-01T10:00:00.000Z'); // Same day, before reset hours for a new reset
        testUser.aiUsage.summaryUsed = 1;
        testUser.aiUsage.lastReset = new RealDate('2023-01-01T08:00:00.000Z');
        await testUser.save();

        await userService.checkUserQuota(testUser._id.toString(), 'summary');
        const updatedUser = await User.findById(testUser._id);
        expect(updatedUser?.aiUsage.summaryUsed).toBe(1);
        expect(updatedUser?.aiUsage.lastReset.toISOString()).toBe('2023-01-01T08:00:00.000Z');
      });

      it('should bypass quota for admin users', async () => {
        mockDate('2023-01-01T10:00:00.000Z');
        testUser.role = AI_USER_TIERS.ADMIN as 'admin';
        testUser.aiUsage.summaryUsed = AI_USAGE_LIMITS.SUMMARY_PER_DAY;
        await testUser.save();
        await expect(userService.checkUserQuota(testUser._id.toString(), 'summary')).resolves.not.toThrow();
      });

      it('should throw NotFoundError if user not found', async () => {
        await expect(userService.checkUserQuota(new mongoose.Types.ObjectId().toString(), 'summary')).rejects.toThrow(NotFoundError);
      });
    });

    describe('incrementAIUsage', () => {
      it('should increment summaryUsed and totalSummariesGenerated for summary type', async () => {
        mockDate('2023-01-01T10:00:00.000Z');
        await userService.incrementAIUsage(testUser._id.toString(), 'summary');
        const updatedUser = await User.findById(testUser._id);
        expect(updatedUser?.aiUsage.summaryUsed).toBe(1);
        expect(updatedUser?.totalSummariesGenerated).toBe(1);
      });

      it('should increment flashcardUsed and totalFlashcardsGenerated for flashcard type', async () => {
        mockDate('2023-01-01T10:00:00.000Z');
        await userService.incrementAIUsage(testUser._id.toString(), 'flashcard');
        const updatedUser = await User.findById(testUser._id);
        expect(updatedUser?.aiUsage.flashcardUsed).toBe(1);
        expect(updatedUser?.totalFlashcardsGenerated).toBe(1);
      });

      it('should reset daily counts and set lastReset if QUOTA_RESET_HOURS passed during increment', async () => {
        testUser.aiUsage.lastReset = new RealDate('2023-01-01T00:00:00.000Z');
        await testUser.save();

        mockDate('2023-01-02T10:00:00.000Z'); // More than QUOTA_RESET_HOURS later
        await userService.incrementAIUsage(testUser._id.toString(), 'summary');

        const updatedUser = await User.findById(testUser._id);
        expect(updatedUser?.aiUsage.summaryUsed).toBe(1);
        expect(updatedUser?.aiUsage.flashcardUsed).toBe(0);
        expect(updatedUser?.aiUsage.lastReset.toISOString()).toBe('2023-01-02T10:00:00.000Z');
        expect(updatedUser?.totalSummariesGenerated).toBe(1);
      });

      it('should throw NotFoundError if user not found', async () => {
        await expect(userService.incrementAIUsage(new mongoose.Types.ObjectId().toString(), 'summary')).rejects.toThrow(NotFoundError);
      });
    });
  });

  describe('Streak Logic', () => {
    describe('updateUserAIStreak', () => {
      it('should initialize streak to 1 if no previous streak and lastUsed is null', async () => {
        mockDate('2023-01-05T10:00:00.000Z');
        testUser.streak.current = 0;
        testUser.streak.max = 0;
        testUser.streak.lastUsed = null as any; // Simulate first ever usage
        await testUser.save();

        await userService.updateUserAIStreak(testUser._id.toString());
        const updatedUser = await User.findById(testUser._id);
        expect(updatedUser?.streak.current).toBe(1);
        expect(updatedUser?.streak.max).toBe(1);
        expect(updatedUser?.streak.lastUsed.toISOString()).toBe('2023-01-05T10:00:00.000Z');
      });

      it('should increment streak if used on consecutive days', async () => {
        mockDate('2023-01-02T10:00:00.000Z'); // Day after baseline
        testUser.streak.current = 1;
        testUser.streak.lastUsed = new RealDate('2023-01-01T14:00:00.000Z');
        await testUser.save();

        await userService.updateUserAIStreak(testUser._id.toString());
        const updatedUser = await User.findById(testUser._id);
        expect(updatedUser?.streak.current).toBe(2);
        expect(updatedUser?.streak.lastUsed.toISOString()).toBe('2023-01-02T10:00:00.000Z');
      });

      it('should update max streak if current streak exceeds it', async () => {
        mockDate('2023-01-02T10:00:00.000Z');
        testUser.streak.current = 1;
        testUser.streak.max = 1;
        testUser.streak.lastUsed = new RealDate('2023-01-01T12:00:00.000Z');
        await testUser.save();

        await userService.updateUserAIStreak(testUser._id.toString());
        const updatedUser = await User.findById(testUser._id);
        expect(updatedUser?.streak.current).toBe(2);
        expect(updatedUser?.streak.max).toBe(2);
      });

      it('should reset streak to 1 if there is a gap of more than one day', async () => {
        mockDate('2023-01-04T10:00:00.000Z'); // Two days after last use
        testUser.streak.current = 3;
        testUser.streak.lastUsed = new RealDate('2023-01-01T18:00:00.000Z');
        await testUser.save();

        await userService.updateUserAIStreak(testUser._id.toString());
        const updatedUser = await User.findById(testUser._id);
        expect(updatedUser?.streak.current).toBe(1);
        expect(updatedUser?.streak.lastUsed.toISOString()).toBe('2023-01-04T10:00:00.000Z');
      });

      it('should not change streak if used multiple times on the same day', async () => {
        mockDate('2023-01-01T18:00:00.000Z'); // Same day as last use, but later time
        testUser.streak.current = 2;
        testUser.streak.lastUsed = new RealDate('2023-01-01T10:00:00.000Z');
        await testUser.save();

        await userService.updateUserAIStreak(testUser._id.toString());
        const updatedUser = await User.findById(testUser._id);
        expect(updatedUser?.streak.current).toBe(2);
        expect(updatedUser?.streak.lastUsed.toISOString()).toBe('2023-01-01T18:00:00.000Z');
      });
      
      it('should handle streak increment across midnight correctly (diffDays === 0 but different date)', async () => {
        // User last used late on Jan 1st
        testUser.streak.current = 1;
        testUser.streak.lastUsed = new RealDate('2023-01-01T23:00:00.000Z');
        await testUser.save();

        // User uses again early on Jan 2nd (less than 24 hours, but next calendar day)
        mockDate('2023-01-02T01:00:00.000Z'); 
        await userService.updateUserAIStreak(testUser._id.toString());
        
        const updatedUser = await User.findById(testUser._id);
        expect(updatedUser?.streak.current).toBe(2);
        expect(updatedUser?.streak.max).toBe(2);
        expect(updatedUser?.streak.lastUsed.toISOString()).toBe('2023-01-02T01:00:00.000Z');
      });

      it('should throw NotFoundError if user not found', async () => {
        await expect(userService.updateUserAIStreak(new mongoose.Types.ObjectId().toString())).rejects.toThrow(NotFoundError);
      });
    });
  });

  describe('XP & Level Management', () => {
    // UserService itself doesn't have a direct addXP. XP is managed via User model's addActivity.
    // We can test the effect of addActivity through a conceptual test or by directly calling user methods.
    // For unit testing calculateLevel, we call it directly on a user instance.

    it('User.calculateLevel should update level based on XP', async () => {
      const user = new User(mockUser({ xp: 0, level: 1 }));
      user.xp = 250;
      user.calculateLevel();
      expect(user.level).toBe(3); // 1 + floor(250/100)

      user.xp = 50;
      user.calculateLevel();
      expect(user.level).toBe(1); // 1 + floor(50/100)

      user.xp = 199;
      user.calculateLevel();
      expect(user.level).toBe(2); // 1 + floor(199/100)
    });

    it('User.addActivity should grant XP and update level', async () => {
      // testUser starts with 100xp, level 2 (from beforeEach and mockUser default)
      // Default mockUser starts with 100xp, level 2. Let's reset for clarity.
      testUser.xp = 0;
      testUser.level = 1;
      await testUser.save();
      
      const initialXP = testUser.xp;
      const initialLevel = testUser.level;
      const xpToGrant = 75;

      testUser.addActivity('upload', 'Uploaded a new note', xpToGrant);
      // Note: addActivity in the factory is a jest.fn(). It calls calculateLevel from factory.
      // For a real test on a User document, the schema method would run.
      // We are testing the schema method's logic as defined in User.ts essentially.
      // Let's manually call calculateLevel as if it were the real schema method being triggered after xp update.
      testUser.xp += xpToGrant; // Simulate direct XP gain for this part of the test
      testUser.calculateLevel(); // Manually call for this test setup
      
      await testUser.save(); // Save changes

      const updatedUser = await User.findById(testUser._id);
      expect(updatedUser?.xp).toBe(initialXP + xpToGrant);
      expect(updatedUser?.level).toBe(1); // 0 + 75xp = 75xp. Level = 1 + floor(75/100) = 1.

      // Add more XP to cross a level threshold
      const moreXp = 50;
      updatedUser!.addActivity('earn_xp', 'Bonus XP', moreXp);
      // updatedUser.xp += moreXp;
      // updatedUser.calculateLevel(); // Schema method should handle this.
      await updatedUser!.save();
      
      const finalUser = await User.findById(testUser._id);
      expect(finalUser?.xp).toBe(initialXP + xpToGrant + moreXp); // 75 + 50 = 125
      expect(finalUser?.level).toBe(2); // Level = 1 + floor(125/100) = 2
    });
  });

  describe('getUsers', () => {
    it('should return users', async () => {
      // Create multiple users
      const users = [
        mockUser({ email: 'user1@example.com', username: 'user1' }),
        mockUser({ email: 'user2@example.com', username: 'user2' }),
        mockUser({ email: 'user3@example.com', username: 'user3' })
      ];
      await User.insertMany(users);

      const result = await userService.getUsers();
      expect(result).toHaveLength(4); // Including testUser
    });
  });

  describe('getUserActivityLog', () => {
    it('should return user activity log with pagination', async () => {
      const activities = [
        mockUserActivity({ action: 'login', timestamp: new Date(Date.now() - 1000) }),
        mockUserActivity({ action: 'upload', timestamp: new Date(Date.now() - 2000) }),
        mockUserActivity({ action: 'earn_badge', timestamp: new Date(Date.now() - 3000) })
      ];
      
      // Need to cast to IUserActivity[] when assigning
      testUser.activity = activities as any;
      await testUser.save();

      const result = await userService.getUserActivityLog(testUser._id.toString(), {
        page: 1,
        limit: 2
      });

      expect(result.activities).toHaveLength(2);
      expect(result.count).toBe(3);
      expect(result.activities[0].action).toBe('login');
    });

    it('should filter activities by type', async () => {
      const activities = [
        mockUserActivity({ action: 'login', timestamp: new Date(Date.now() - 1000) }),
        mockUserActivity({ action: 'upload', timestamp: new Date(Date.now() - 2000) })
      ];
      
      // Need to cast to IUserActivity[] when assigning
      testUser.activity = activities as any;
      await testUser.save();

      const result = await userService.getUserActivityLog(testUser._id.toString(), {
        page: 1,
        limit: 10,
        type: 'upload'
      });

      expect(result.activities).toHaveLength(1);
      expect(result.activities[0].action).toBe('upload');
    });
  });

  describe('getUserUploadedNotes', () => {
    it('should return user uploaded notes with pagination', async () => {
      const notes = [
        mockNote({ user: testUser._id, title: 'Note 1' }),
        mockNote({ user: testUser._id, title: 'Note 2' }),
        mockNote({ user: testUser._id, title: 'Note 3' })
      ];
      await Note.insertMany(notes);

      const result = await userService.getUserUploadedNotes(testUser._id.toString(), {
        page: 1,
        limit: 2
      });

      expect(result.notes).toHaveLength(2);
      expect(result.total).toBe(3);
    });

    it('should filter notes by subject', async () => {
      const notes = [
        mockNote({ user: testUser._id, title: 'Math Note', subject: 'Math' }),
        mockNote({ user: testUser._id, title: 'Science Note', subject: 'Science' })
      ];
      await Note.insertMany(notes);

      const result = await userService.getUserUploadedNotes(testUser._id.toString(), {
        page: 1,
        limit: 10,
        subject: 'Math'
      });

      expect(result.notes).toHaveLength(1);
      expect(result.notes[0].subject).toBe('Math');
    });
  });

  describe('getUserFavoriteNotes', () => {
    it('should return user favorite notes with pagination', async () => {
      const notes = [
        mockNote({ user: testUser._id, title: 'Note 1' }),
        mockNote({ user: testUser._id, title: 'Note 2' })
      ];
      const savedNotes = await Note.insertMany(notes);
      
      testUser.favoriteNotes = savedNotes.map(note => note._id);
      await testUser.save();

      const result = await userService.getUserFavoriteNotes(testUser._id.toString(), {
        page: 1,
        limit: 1
      });

      expect(result.notes).toHaveLength(1);
      expect(result.total).toBe(2);
    });
  });

  describe('addNoteToFavorites', () => {
    it('should add note to user favorites', async () => {
      const note = await Note.create(mockNote({ user: testUser._id }));
      
      await userService.addNoteToFavorites(testUser._id.toString(), note._id.toString());
      
      const updatedUser = await User.findById(testUser._id);
      expect(updatedUser?.favoriteNotes).toHaveLength(1);
      expect(updatedUser?.favoriteNotes[0].toString()).toBe(note._id.toString());
    });

    it('should not add duplicate note to favorites', async () => {
      const note = await Note.create(mockNote({ user: testUser._id }));
      
      // Add note to favorites twice
      await userService.addNoteToFavorites(testUser._id.toString(), note._id.toString());
      await userService.addNoteToFavorites(testUser._id.toString(), note._id.toString());
      
      const updatedUser = await User.findById(testUser._id);
      expect(updatedUser?.favoriteNotes).toHaveLength(1);
    });

    it('should throw error for non-existent note', async () => {
      const nonExistentId = new mongoose.Types.ObjectId().toString();
      await expect(
        userService.addNoteToFavorites(testUser._id.toString(), nonExistentId)
      ).rejects.toThrow('Note not found');
    });
  });

  // TODO: Add test suites for other UserService methods like CRUD operations, profile, badges, etc.
}); 
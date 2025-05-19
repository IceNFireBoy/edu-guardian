import mongoose from 'mongoose';
import { BadgeService } from '../../services/BadgeService';
import { Badge, IBadge } from '../../models/Badge';
import { User, IUser } from '../../models/User';

describe('BadgeService', () => {
  let badgeService: BadgeService;
  let testUser: IUser & { _id: mongoose.Types.ObjectId };
  let testBadge: IBadge & { _id: mongoose.Types.ObjectId };

  beforeAll(async () => {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/test');
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await User.deleteMany({});
    await Badge.deleteMany({});
    badgeService = new BadgeService();
    
    testUser = await User.create({
      name: 'Test User',
      email: `test-${Date.now()}@example.com`,
      username: `testuser-${Date.now()}`,
      password: 'password123',
      role: 'user'
    }) as IUser & { _id: mongoose.Types.ObjectId };

    testBadge = await Badge.create({
      name: 'Test Badge',
      description: 'A test badge',
      category: 'engagement',
      rarity: 'common',
      xpReward: 50,
      criteria: {
        type: 'note_count',
        threshold: 5
      },
      isActive: true
    }) as IBadge & { _id: mongoose.Types.ObjectId };
  });

  afterEach(async () => {
    await User.deleteMany({});
    await Badge.deleteMany({});
    jest.clearAllMocks();
  });

  describe('createBadge', () => {
    it('should create a new badge', async () => {
      const badgeData = {
        name: 'New Badge',
        description: 'New Description',
        category: 'engagement',
        rarity: 'common',
        criteria: {
          type: 'note_count',
          threshold: 5
        },
        xpReward: 50,
        isActive: true
      };

      const badge = await badgeService.createBadge(badgeData);
      expect(badge).toBeDefined();
      expect(badge.name).toBe('New Badge');
      expect(badge.description).toBe('New Description');
    });

    it('should throw error for duplicate badge name', async () => {
      const badgeData = {
        name: 'Test Badge',
        description: 'Duplicate Description',
        category: 'engagement',
        rarity: 'common',
        criteria: {
          type: 'note_count',
          threshold: 5
        },
        xpReward: 100,
        isActive: true
      };

      await expect(badgeService.createBadge(badgeData))
        .rejects.toThrow();
    });
  });

  describe('getAllActiveBadges', () => {
    it('should return all active badges', async () => {
      // Create multiple badges
      const badges = [
        {
          name: 'Badge 1',
          description: 'Badge 1 Description',
          category: 'engagement',
          rarity: 'common',
          xpReward: 50,
          criteria: { type: 'test', value: 1 },
          isActive: true
        },
        {
          name: 'Badge 2',
          description: 'Badge 2 Description',
          category: 'engagement',
          rarity: 'common',
          xpReward: 50,
          criteria: { type: 'test', value: 1 },
          isActive: true
        },
        {
          name: 'Badge 3',
          description: 'Badge 3 Description',
          category: 'engagement',
          rarity: 'common',
          xpReward: 50,
          criteria: { type: 'test', value: 1 },
          isActive: false
        }
      ];
      await Badge.insertMany(badges);

      const result = await badgeService.getAllActiveBadges();
      expect(result).toHaveLength(3); // Including testBadge
      expect(result.every(badge => badge.isActive)).toBe(true);
    });
  });

  describe('getBadgeById', () => {
    it('should return a badge by id', async () => {
      const result = await badgeService.getBadgeById(testBadge._id.toString());
      expect(result).toBeDefined();
      expect(result?.name).toBe('Test Badge');
    });

    it('should throw error for non-existent badge', async () => {
      await expect(badgeService.getBadgeById(new mongoose.Types.ObjectId().toString()))
        .rejects.toThrow('Badge not found');
    });
  });

  describe('updateBadge', () => {
    it('should update a badge', async () => {
      const updateData = {
        name: 'Updated Badge',
        description: 'Updated Description'
      };

      const updatedBadge = await badgeService.updateBadge(testBadge._id.toString(), updateData);
      expect(updatedBadge).toBeDefined();
      expect(updatedBadge?.name).toBe('Updated Badge');
      expect(updatedBadge?.description).toBe('Updated Description');
    });

    it('should throw error for non-existent badge', async () => {
      const updateData = {
        name: 'Updated Badge',
        description: 'Updated Description'
      };

      await expect(badgeService.updateBadge(
        new mongoose.Types.ObjectId().toString(),
        updateData
      )).rejects.toThrow('Badge not found');
    });
  });

  describe('deleteBadge', () => {
    it('should delete a badge', async () => {
      const result = await badgeService.deleteBadge(testBadge._id.toString());
      expect(result).toBe(true);
      const badge = await Badge.findById(testBadge._id);
      expect(badge).toBeNull();
    });

    it('should throw error for non-existent badge', async () => {
      await expect(badgeService.deleteBadge(new mongoose.Types.ObjectId().toString()))
        .rejects.toThrow('Badge not found');
    });
  });

  describe('awardBadgeToUser', () => {
    it('should award a badge to a user', async () => {
      const result = await badgeService.awardBadgeToUser(
        testUser._id.toString(),
        testBadge._id.toString()
      );
      expect(result).toBe(true);
      const updatedUser = await User.findById(testUser._id);
      expect(updatedUser?.badges.some(b => b.badge.toString() === testBadge._id.toString())).toBe(true);
    });

    it('should throw error for non-existent user', async () => {
      await expect(badgeService.awardBadgeToUser(
        new mongoose.Types.ObjectId().toString(),
        testBadge._id.toString()
      )).rejects.toThrow('User not found');
    });

    it('should throw error for non-existent badge', async () => {
      await expect(badgeService.awardBadgeToUser(
        testUser._id.toString(),
        new mongoose.Types.ObjectId().toString()
      )).rejects.toThrow('Badge not found');
    });
  });

  describe('checkAndAwardBadges', () => {
    it('should award badge when criteria is met', async () => {
      // Set up user with enough notes to meet badge criteria
      await User.findByIdAndUpdate(testUser._id, {
        $set: { 'totalNotes': 5 }
      });

      const result = await badgeService.checkAndAwardBadges(testUser._id.toString(), 'note_created');
      
      expect(result).toHaveLength(1);
      expect(result[0].badge.name).toBe('Test Badge');
      
      const updatedUser = await User.findById(testUser._id);
      expect(updatedUser?.badges).toHaveLength(1);
      expect(updatedUser?.xp).toBe(50); // XP reward from badge
    });

    it('should not award badge when criteria is not met', async () => {
      await User.findByIdAndUpdate(testUser._id, {
        $set: { 'totalNotes': 3 } // Below threshold of 5
      });

      const result = await badgeService.checkAndAwardBadges(testUser._id.toString(), 'note_created');
      expect(result).toHaveLength(0);
      
      const updatedUser = await User.findById(testUser._id);
      expect(updatedUser?.badges).toHaveLength(0);
      expect(updatedUser?.xp).toBe(0);
    });

    it('should not award badge that user already has', async () => {
      // Award badge first time
      await User.findByIdAndUpdate(testUser._id, {
        $set: { 'totalNotes': 5 }
      });
      await badgeService.checkAndAwardBadges(testUser._id.toString(), 'note_created');

      // Try to award again
      const result = await badgeService.checkAndAwardBadges(testUser._id.toString(), 'note_created');
      expect(result).toHaveLength(0);
      
      const updatedUser = await User.findById(testUser._id);
      expect(updatedUser?.badges).toHaveLength(1);
      expect(updatedUser?.xp).toBe(50); // XP should not increase
    });

    it('should throw error for non-existent user', async () => {
      const nonExistentId = new mongoose.Types.ObjectId().toString();
      await expect(
        badgeService.checkAndAwardBadges(nonExistentId, 'note_created')
      ).rejects.toThrow('User not found');
    });
  });
});

 
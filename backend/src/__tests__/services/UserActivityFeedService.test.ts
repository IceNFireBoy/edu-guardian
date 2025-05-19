import { UserActivityFeedService } from '../../../services/UserActivityFeedService';
import User from '../../../models/User';
import { mockUser, mockUserActivity } from '../../factories/user.factory';
import mongoose from 'mongoose';

describe('UserActivityFeedService', () => {
  let userActivityFeedService: UserActivityFeedService;
  let testUser: any;

  beforeEach(async () => {
    await User.deleteMany({});
    userActivityFeedService = new UserActivityFeedService();
    
    testUser = await User.create(mockUser({
      email: `test-${Date.now()}@example.com`,
      username: `testuser-${Date.now()}`
    }));
  });

  afterEach(async () => {
    await User.deleteMany({});
  });

  describe('getUserActivityFeed', () => {
    it('should return user activity feed with pagination', async () => {
      // Add some activities to the user
      const activities = [
        mockUserActivity({ action: 'login', timestamp: new Date(Date.now() - 1000) }),
        mockUserActivity({ action: 'note_created', timestamp: new Date(Date.now() - 2000) }),
        mockUserActivity({ action: 'badge_earned', timestamp: new Date(Date.now() - 3000) })
      ];
      
      testUser.activity = activities;
      await testUser.save();

      const result = await userActivityFeedService.getUserActivityFeed(testUser._id.toString(), {
        page: 1,
        limit: 2
      });

      expect(result.activities).toHaveLength(2);
      expect(result.total).toBe(3);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(2);
      expect(result.activities[0].action).toBe('login');
      expect(result.activities[1].action).toBe('note_created');
    });

    it('should filter activities by type', async () => {
      const activities = [
        mockUserActivity({ action: 'login', timestamp: new Date(Date.now() - 1000) }),
        mockUserActivity({ action: 'note_created', timestamp: new Date(Date.now() - 2000) }),
        mockUserActivity({ action: 'badge_earned', timestamp: new Date(Date.now() - 3000) })
      ];
      
      testUser.activity = activities;
      await testUser.save();

      const result = await userActivityFeedService.getUserActivityFeed(testUser._id.toString(), {
        page: 1,
        limit: 10,
        type: 'note_created'
      });

      expect(result.activities).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.activities[0].action).toBe('note_created');
    });

    it('should return empty feed for user with no activity', async () => {
      const result = await userActivityFeedService.getUserActivityFeed(testUser._id.toString(), {
        page: 1,
        limit: 10
      });

      expect(result.activities).toHaveLength(0);
      expect(result.total).toBe(0);
    });

    it('should throw error for non-existent user', async () => {
      const nonExistentId = new mongoose.Types.ObjectId().toString();
      await expect(
        userActivityFeedService.getUserActivityFeed(nonExistentId, {
          page: 1,
          limit: 10
        })
      ).rejects.toThrow('User not found');
    });
  });

  describe('addActivityToFeed', () => {
    it('should add activity to user feed', async () => {
      const activity = mockUserActivity({ action: 'note_created' });
      await userActivityFeedService.addActivityToFeed(testUser._id.toString(), activity);

      const updatedUser = await User.findById(testUser._id);
      expect(updatedUser?.activity).toHaveLength(1);
      expect(updatedUser?.activity[0].action).toBe('note_created');
    });

    it('should throw error when adding activity to non-existent user', async () => {
      const nonExistentId = new mongoose.Types.ObjectId().toString();
      const activity = mockUserActivity({ action: 'note_created' });

      await expect(
        userActivityFeedService.addActivityToFeed(nonExistentId, activity)
      ).rejects.toThrow('User not found');
    });

    it('should limit activity feed to maximum size', async () => {
      const MAX_ACTIVITY_SIZE = 100;
      const activities = Array(MAX_ACTIVITY_SIZE + 10).fill(null).map(() => 
        mockUserActivity({ action: 'login' })
      );
      
      testUser.activity = activities;
      await testUser.save();

      const newActivity = mockUserActivity({ action: 'note_created' });
      await userActivityFeedService.addActivityToFeed(testUser._id.toString(), newActivity);

      const updatedUser = await User.findById(testUser._id);
      expect(updatedUser?.activity).toHaveLength(MAX_ACTIVITY_SIZE);
      expect(updatedUser?.activity[0].action).toBe('note_created'); // Newest activity should be first
    });
  });
}); 
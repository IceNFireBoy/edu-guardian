import mongoose from 'mongoose';
import BadgeService from '../../services/BadgeService';
import User, { IUser, IUserActivity } from '../../models/User';
import Badge, { IBadge } from '../../models/Badge';
import { mockUser, mockUserActivity } from '../factories/user.factory';
import { mockBadge } from '../factories/badge.factory';
import { NotFoundError } from '../../utils/customErrors';
import { CreateFileResponse } from '@google/generative-ai/files';

// Mock Date
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

describe('BadgeService', () => {
  let badgeService: BadgeService;
  let testUser: IUser & { _id: mongoose.Types.ObjectId }; // Ensure _id is ObjectId for Mongoose ops

  // Define AI Badges with slugs matching BadgeCriteriaMap keys
  const aiBadgesData: Partial<IBadge>[] = [
    { name: 'AI Novice', slug: 'ai_novice', description: 'Summarize 3 notes in 3 days.', category: 'ai', requirements: { type: 'ai_novice', value: 3 }, xpReward: 25, level: 'bronze' },
    { name: 'Flashcard Fanatic', slug: 'flashcard_fanatic', description: 'Create 5 flashcard sets in 5 days.', category: 'ai', requirements: { type: 'flashcard_fanatic', value: 5 }, xpReward: 30, level: 'silver' },
    { name: 'AI Streaker', slug: 'ai_streaker', description: 'Maintain a 5-day AI usage streak.', category: 'ai', requirements: { type: 'ai_streaker', value: 5 }, xpReward: 50, level: 'gold' },
    { name: 'Summarizer Master', slug: 'summarizer_master', description: 'Generate 15 lifetime summaries.', category: 'ai', requirements: { type: 'summarizer_master', value: 15 }, xpReward: 75, level: 'gold' },
    { name: 'Flashcard Legend', slug: 'flashcard_legend', description: 'Generate 25 lifetime flashcard sets.', category: 'ai', requirements: { type: 'flashcard_legend', value: 25 }, xpReward: 100, level: 'platinum' },
  ];

  beforeAll(async () => {
    badgeService = new BadgeService();
    // Create AI badges in DB
    await Badge.deleteMany({}); // Clear existing badges
    for (const badgeData of aiBadgesData) {
        const badge = new Badge(mockBadge(badgeData)); // Use factory, override slug
        // Manually set slug because pre-save hook might overwrite if name changes slug format
        badge.slug = badgeData.slug!;
        await badge.save();
    }
  });

  beforeEach(async () => {
    await User.deleteMany({});
    const userDoc = new User(mockUser({
      email: `badgeuser-${Date.now()}@example.com`,
      username: `badgeuser-${Date.now()}`
    }));
    testUser = await userDoc.save() as IUser & { _id: mongoose.Types.ObjectId }; // Cast to include ObjectId
    
    // Reset date mock for each test
    global.Date = RealDate;
  });

  afterAll(async () => {
    await Badge.deleteMany({});
    await User.deleteMany({});
  });

  describe('checkAndAwardBadges', () => {
    describe('AI Badges', () => {
      it('should award "AI Novice" badge for 3 summaries in 3 days', async () => {
        mockDate('2023-01-03T10:00:00.000Z'); // Current time

        // Simulate activity
        testUser.activity = [
          mockUserActivity({ action: 'ai_summary', description: 'Note A', createdAt: new Date('2023-01-01T10:00:00.000Z') }),
          mockUserActivity({ action: 'ai_summary', description: 'Note B', createdAt: new Date('2023-01-02T10:00:00.000Z') }),
          mockUserActivity({ action: 'ai_summary', description: 'Note C', createdAt: new Date('2023-01-03T09:00:00.000Z') }),
        ];
        await testUser.save();

        const awardedBadges = await badgeService.checkAndAwardBadges(testUser._id.toString(), 'ai_summary');
        
        expect(awardedBadges.length).toBe(1);
        expect(awardedBadges[0].badge.slug).toBe('ai_novice');
        const userAfter = await User.findById(testUser._id);
        expect(userAfter?.badges.some(b => (b.badge as IBadge).slug === 'ai_novice')).toBe(true);
        expect(userAfter?.xp).toBe(aiBadgesData.find(b=>b.slug === 'ai_novice')!.xpReward);
      });

      it('should award "Flashcard Fanatic" badge for 5 flashcard sets in 5 days', async () => {
        mockDate('2023-01-05T10:00:00.000Z'); // Current time
        testUser.activity = [
          mockUserActivity({ action: 'ai_flashcards', createdAt: new Date('2023-01-01T10:00:00.000Z') }),
          mockUserActivity({ action: 'ai_flashcards', createdAt: new Date('2023-01-02T10:00:00.000Z') }),
          mockUserActivity({ action: 'ai_flashcards', createdAt: new Date('2023-01-03T10:00:00.000Z') }),
          mockUserActivity({ action: 'ai_flashcards', createdAt: new Date('2023-01-04T10:00:00.000Z') }),
          mockUserActivity({ action: 'ai_flashcards', createdAt: new Date('2023-01-05T09:00:00.000Z') }),
        ];
        await testUser.save();

        const awardedBadges = await badgeService.checkAndAwardBadges(testUser._id.toString(), 'ai_flashcards');
        expect(awardedBadges.length).toBe(1);
        expect(awardedBadges[0].badge.slug).toBe('flashcard_fanatic');
      });

      it('should award "AI Streaker" badge for a 5-day AI usage streak', async () => {
        mockDate('2023-01-05T10:00:00.000Z');
        testUser.streak.current = 5;
        testUser.streak.lastUsed = new Date('2023-01-04T12:00:00.000Z'); // Last usage was yesterday
        // Simulate activities that would contribute to the streak
        testUser.activity = [
            mockUserActivity({ action: 'ai_summary', createdAt: new Date('2023-01-01T10:00:00.000Z') }),
            mockUserActivity({ action: 'ai_flashcards', createdAt: new Date('2023-01-02T10:00:00.000Z') }),
            mockUserActivity({ action: 'ai_summary', createdAt: new Date('2023-01-03T10:00:00.000Z') }),
            mockUserActivity({ action: 'ai_flashcards', createdAt: new Date('2023-01-04T10:00:00.000Z') }),
            // The check for the streak badge might be triggered by today's activity (eventData in real scenario)
            // or by a periodic check. For this test, directly setting streak.current = 5 suffices.
        ];
        await testUser.save();
        
        // Trigger with a generic AI event that would update streak first, then check badges
        // For this test, assuming streak is already correctly at 5 by another service (e.g. UserService)
        // before checkAndAwardBadges is called.
        const awardedBadges = await badgeService.checkAndAwardBadges(testUser._id.toString(), 'ai_usage_generic');
        expect(awardedBadges.length).toBe(1);
        expect(awardedBadges[0].badge.slug).toBe('ai_streaker');
      });

      it('should award "Summarizer Master" badge for 15 lifetime summaries', async () => {
        testUser.totalSummariesGenerated = 15;
        await testUser.save();

        const awardedBadges = await badgeService.checkAndAwardBadges(testUser._id.toString(), 'ai_summary');
        expect(awardedBadges.length).toBe(1);
        expect(awardedBadges[0].badge.slug).toBe('summarizer_master');
      });
      
      it('should award "Flashcard Legend" badge for 25 lifetime flashcard sets', async () => {
        testUser.totalFlashcardsGenerated = 25;
        await testUser.save();

        const awardedBadges = await badgeService.checkAndAwardBadges(testUser._id.toString(), 'ai_flashcards');
        expect(awardedBadges.length).toBe(1);
        expect(awardedBadges[0].badge.slug).toBe('flashcard_legend');
      });

      it('should not award already earned badges', async () => {
        mockDate('2023-01-03T10:00:00.000Z');
        testUser.activity = [
          mockUserActivity({ action: 'ai_summary', createdAt: new Date('2023-01-01T10:00:00.000Z') }),
          mockUserActivity({ action: 'ai_summary', createdAt: new Date('2023-01-02T10:00:00.000Z') }),
          mockUserActivity({ action: 'ai_summary', createdAt: new Date('2023-01-03T09:00:00.000Z') }),
        ];
        // Manually add the badge as already earned
        const aiNoviceBadge = await Badge.findOne({ slug: 'ai_novice' });
        testUser.badges = [{ badge: aiNoviceBadge!._id, earnedAt: new Date('2023-01-02T00:00:00.000Z'), criteriaMet: 'test' }];
        await testUser.save();

        const awardedBadges = await badgeService.checkAndAwardBadges(testUser._id.toString(), 'ai_summary');
        expect(awardedBadges.length).toBe(0); // Should not re-award
      });

      it('should award multiple badges if criteria for all are met and not yet earned', async () => {
        mockDate('2023-01-05T10:00:00.000Z');
        testUser.activity = [ // For AI Novice & Flashcard Fanatic
            ...Array(3).fill(0).map((_,i) => mockUserActivity({ action: 'ai_summary', createdAt: new Date(`2023-01-0${i+1}T10:00:00.000Z`) })),
            ...Array(5).fill(0).map((_,i) => mockUserActivity({ action: 'ai_flashcards', createdAt: new Date(`2023-01-0${i+1}T11:00:00.000Z`) }))
        ];
        testUser.totalSummariesGenerated = 15; // For Summarizer Master
        testUser.totalFlashcardsGenerated = 25; // For Flashcard Legend
        testUser.streak.current = 5; // For AI Streaker
        testUser.streak.lastUsed = new Date('2023-01-04T12:00:00.000Z');
        await testUser.save();

        // Call with a generic event, or specific ones, the map should pick up all relevant
        const awardedBadges = await badgeService.checkAndAwardBadges(testUser._id.toString(), 'user_activity_generic');
        
        // Expect all 5 AI badges to be awarded
        expect(awardedBadges.length).toBe(5);
        const awardedSlugs = awardedBadges.map(b => b.badge.slug);
        expect(awardedSlugs).toContain('ai_novice');
        expect(awardedSlugs).toContain('flashcard_fanatic');
        expect(awardedSlugs).toContain('ai_streaker');
        expect(awardedSlugs).toContain('summarizer_master');
        expect(awardedSlugs).toContain('flashcard_legend');

        const userAfter = await User.findById(testUser._id);
        expect(userAfter?.badges.length).toBe(5);
        
        // Check total XP (sum of all AI badges)
        const totalExpectedXp = aiBadgesData.reduce((sum, badge) => sum + badge.xpReward!, 0);
        expect(userAfter?.xp).toBe(totalExpectedXp);
      });
    });
    
    // TODO: Add tests for other badge categories (upload, engagement, study, xp, level)
    // TODO: Test edge cases, like user not found, no active badges available

  });

 
import { Request, Response, NextFunction } from 'express';
import asyncHandler from '../middleware/async';
import UserActivityFeedService from '../services/UserActivityFeedService';
import BadgeService from '../services/BadgeService';

export default class UserActivityFeedController {
    /**
     * @desc    Get user activity feed items
     * @route   GET /api/v1/user/feed
     * @access  Private
     */
    public getUserFeed = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
        const userId = req.user.id;
        const options = {
            page: parseInt(req.query.page as string) ?? 1,
            limit: parseInt(req.query.limit as string) ?? 20,
            filter: (req.query.filter as 'my' | 'class' | 'global' | 'ai') ?? 'my',
            type: req.query.type as string,
            sortBy: req.query.sortBy as string ?? 'createdAt',
            sortOrder: (req.query.sortOrder as 'asc' | 'desc') ?? 'desc'
        };

        const feed = await UserActivityFeedService.getUserActivityFeed(userId, options);

        res.status(200).json({
            success: true,
            data: feed.items,
            pagination: {
                totalCount: feed.totalCount,
                hasMore: feed.hasMore,
                currentPage: options.page,
                totalPages: Math.ceil(feed.totalCount / options.limit)
            }
        });
    });

    /**
     * @desc    Check and award badges based on a specific event
     * @route   POST /api/v1/user/check-badges
     * @access  Private
     */
    public checkAndAwardBadges = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
        const userId = req.user.id;
        const { event, eventData } = req.body;

        if (!event) {
            return res.status(400).json({
                success: false,
                error: 'Event type is required'
            });
        }

        const awardedBadges = await BadgeService.checkAndAwardBadges(userId, event, eventData);

        res.status(200).json({
            success: true,
            data: {
                awardedBadges,
                newBadgeCount: awardedBadges.length
            }
        });
    });

    /**
     * @desc    Log a completed study session
     * @route   POST /api/v1/user/study-complete
     * @access  Private
     */
    public logStudyCompletion = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
        const userId = req.user.id;
        const { noteId, duration, flashcardsReviewed } = req.body;

        if (!noteId || !duration) {
            return res.status(400).json({
                success: false,
                error: 'Note ID and duration are required'
            });
        }

        // Need to implement a UserStudyService or add this to UserService
        // For now, we'll manually trigger the badge check and update user data
        
        // 1. Get the user
        const User = require('../models/User').default;  // Assuming this is how your User model is exported
        const user = await User.findById(userId);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }
        
        // 2. Update the user's streak
        user.updateStreak();
        
        // 3. Add XP based on duration (1 XP per minute, capped at reasonable amount)
        const xpEarned = Math.min(Math.floor(duration), 60); // Cap at 60 XP for 60+ minutes
        user.xp += xpEarned;
        user.calculateLevel();
        
        // 4. Log activity
        const studyDescription = flashcardsReviewed 
            ? `Completed ${duration} minute study session with ${flashcardsReviewed} flashcards reviewed`
            : `Completed ${duration} minute study session`;
        
        user.addActivity('study', studyDescription, xpEarned);
        
        await user.save();
        
        // 5. Check for badges
        const awardedBadges = await BadgeService.checkAndAwardBadges(userId, 'complete_study', {
            noteId,
            duration,
            flashcardsReviewed
        });
        
        res.status(200).json({
            success: true,
            data: {
                xpEarned,
                currentStreak: user.currentStreak,
                level: user.level,
                awardedBadges,
                newBadgeCount: awardedBadges.length
            }
        });
    });
} 
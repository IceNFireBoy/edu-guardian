import { Request, Response, NextFunction } from 'express';
import asyncHandler from '../middleware/async';
import ErrorResponse from '../utils/errorResponse';
import { CustomRequest } from '../middleware/auth';
import UserService from '../services/UserService';
import BadgeService from '../services/BadgeService';
import { IUserActivity } from '../models/User';

export default class UserActivityFeedController {
    /**
     * @desc    Get user activity feed
     * @route   GET /api/v1/activity/feed
     * @access  Private
     */
    public static getUserFeed = asyncHandler(async (req: CustomRequest, res: Response, next: NextFunction) => {
        if (!req.user || !req.user.id) {
            return next(new ErrorResponse('Not authorized, user data unavailable', 401));
        }

        try {
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 10;
            const type = req.query.type as string;

            const activityLog = await UserService.getUserActivityLog(req.user.id, {
                page,
                limit,
                type,
                sortBy: 'timestamp',
                sortOrder: 'desc'
            });

            res.status(200).json({
                success: true,
                data: activityLog
            });
        } catch (error) {
            next(error);
        }
    });

    /**
     * @desc    Check and award badges based on user activity
     * @route   POST /api/v1/activity/check-badges
     * @access  Private
     */
    public static checkAndAwardBadges = asyncHandler(async (req: CustomRequest, res: Response, next: NextFunction) => {
        if (!req.user || !req.user.id) {
            return next(new ErrorResponse('Not authorized, user data unavailable', 401));
        }

        const { event, eventData } = req.body;
        if (!event) {
            return next(new ErrorResponse('Event type is required', 400));
        }

        try {
            await BadgeService.checkAndAwardBadges(req.user.id, event, eventData);
            res.status(200).json({
                success: true,
                message: 'Badge check completed'
            });
        } catch (error) {
            next(error);
        }
    });

    /**
     * @desc    Log study session completion
     * @route   POST /api/v1/activity/study-complete
     * @access  Private
     */
    public static logStudyCompletion = asyncHandler(async (req: CustomRequest, res: Response, next: NextFunction) => {
        if (!req.user || !req.user.id) {
            return next(new ErrorResponse('Not authorized, user data unavailable', 401));
        }

        const { noteId, duration } = req.body;
        if (!noteId || !duration) {
            return next(new ErrorResponse('Note ID and duration are required', 400));
        }

        try {
            const user = await UserService.updateUserAIStreak(req.user.id);
            await BadgeService.checkAndAwardBadges(req.user.id, 'study_complete', { noteId, duration });

            res.status(200).json({
                success: true,
                data: {
                    message: 'Study session logged successfully',
                    user: {
                        streak: user.streak,
                        lastActive: user.lastActive
                    }
                }
            });
        } catch (error) {
            next(error);
        }
    });
} 
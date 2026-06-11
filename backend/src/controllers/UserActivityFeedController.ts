import { Request, Response, NextFunction } from 'express';
import asyncHandler from '../middleware/async';
import ErrorResponse from '../utils/errorResponse';
import { CustomRequest } from '../middleware/auth';
import UserService from '../services/UserService';
import BadgeService from '../services/BadgeService';
import mongoose from 'mongoose';
import User, { IUserActivity } from '../models/User';
import Note from '../models/Note';

// XP awarded for completing a study session on a note
const STUDY_COMPLETE_XP = 5;

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
        const durationSeconds = Number(duration);
        if (!noteId || !Number.isFinite(durationSeconds) || durationSeconds <= 0) {
            return next(new ErrorResponse('Note ID and a positive duration (seconds) are required', 400));
        }

        const note = await Note.findById(noteId).select('title');
        if (!note) {
            return next(new ErrorResponse(`Note not found with id of ${noteId}`, 404));
        }

        try {
            // Streak first: it loads, mutates, saves and returns a PLAIN
            // object (toObject), so reload the document for further writes.
            await UserService.updateStudyStreak(req.user.id);
            const user = await User.findById(req.user.id);
            if (!user) {
                return next(new ErrorResponse('User not found', 404));
            }

            // Per-note studied record (upsert into the embedded array)
            const existing = user.studiedNotes.find(sn => sn.note.toString() === noteId);
            if (existing) {
                existing.timesStudied += 1;
                existing.totalSeconds += durationSeconds;
                existing.lastStudiedAt = new Date();
            } else {
                user.studiedNotes.push({
                    note: note._id as mongoose.Types.ObjectId,
                    lastStudiedAt: new Date(),
                    totalSeconds: durationSeconds,
                    timesStudied: 1
                });
            }

            user.addActivity('study', `Studied "${note.title}"`, STUDY_COMPLETE_XP);
            await user.save();

            const newBadges = await BadgeService.checkAndAwardBadges(req.user.id, 'study_complete', { noteId, duration: durationSeconds });
            const studiedEntry = user.studiedNotes.find(sn => sn.note.toString() === noteId);

            res.status(200).json({
                success: true,
                data: {
                    message: 'Study session logged successfully',
                    xpEarned: STUDY_COMPLETE_XP,
                    user: {
                        streak: user.streak,
                        xp: user.xp,
                        level: user.level,
                        lastActive: user.lastActive
                    },
                    studiedNote: studiedEntry ? {
                        noteId,
                        timesStudied: studiedEntry.timesStudied,
                        totalSeconds: studiedEntry.totalSeconds,
                        lastStudiedAt: studiedEntry.lastStudiedAt
                    } : null,
                    newBadges: newBadges ?? []
                }
            });
        } catch (error) {
            next(error);
        }
    });
} 